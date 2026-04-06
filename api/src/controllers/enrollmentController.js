import { MercadoPagoConfig, Payment } from 'mercadopago';
// Imports fs/path removed

import { signAccess, signRefresh, ACCESS_EXPIRES, REFRESH_EXPIRES } from '../utils/jwt.js';
import { sendWelcomeEmail, sendCredentialsEmail } from '../services/emailService.js';
import prisma from '../db.js';

async function countVimeoIds() {
  try {
     const count = await prisma.videoLesson.count({
        where: {
            AND: [
                { vimeoId: { not: "" } },
                { vimeoId: { not: null } }
            ]
        }
    });
    return count;
  } catch (e) {
    console.error('Erro ao contar aulas (enrollmentController):', e);
    return 52; 
  }
}

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const DATA_FIM_PROMOCAO = new Date('2025-12-17T23:59:59-03:00'); // Horário de Brasília
const PRECOS = {
    TIER_1: { COM: 799.00, SEM: 599.00 }, // Primeiros 20 alunos
    TIER_2: { COM: 1000.00, SEM: 700.00 }, // Até 17/12
    TIER_3: { COM: 1920.00, SEM: 1520.00 } // Preço Normal
};

async function calcularPreco(modalidade) {
    const totalAlunosPagos = await prisma.enrollment.count({ where: { status: { in: ['PAID','ADMIN'] } } });
    const agora = new Date();

    // A partir de agora sempre retornar o preço da TIER_3 como padrão.
    // Mantemos as outras regras/valores no código para histórico/futuro uso.
    const valorFinal = (modalidade === 'COM_MATERIAL') ? PRECOS.TIER_3.COM : PRECOS.TIER_3.SEM;
    return valorFinal;
}

export const createEnrollment = async (req, res) => {
    try {
        console.log("[createEnrollment] Iniciando processamento...");
        // Recebemos 'paymentMethodId' (visa/master), 'token' e agora 'coupon' do frontend
        const { name, email, cpf, phone, modality, paymentMethod, installments, token, paymentMethodId, coupon } = req.body;
        
        console.log("[createEnrollment] Body recebido:", JSON.stringify({ name, email, cpf, phone, modality, paymentMethod, coupon }, null, 2));

        if (!modality) {
            console.error("[createEnrollment] Modalidade não fornecida.");
            return res.status(400).json({ error: "Modalidade inválida." });
        }

        let valorCobrado = await calcularPreco(modality);
        
        // --- LÓGICA DE CUPOM ---
        if (coupon) {
            // normalize: remove diacritics, spaces and non-alphanumeric, then uppercase
            const cup = String(coupon || '')
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
                .replace(/\s+/g, '')
                .replace(/[^A-Za-z0-9]/g, '')
                .toUpperCase();

            // Buscar cupom no banco
            const dbCoupon = await prisma.coupon.findUnique({
                where: { code: cup }
            });

            if (dbCoupon) {
                if (dbCoupon.type === 'FIXED_PRICE') {
                    console.log(`[createEnrollment] Cupom aplicado: ${dbCoupon.code} (preço fixo R$${dbCoupon.discount.toFixed(2)})`);
                    valorCobrado = dbCoupon.discount;
                } else {
                    console.log(`[createEnrollment] Cupom aplicado: ${dbCoupon.code} (${dbCoupon.discount}% OFF)`);
                    valorCobrado = valorCobrado * (1 - dbCoupon.discount / 100);
                }
            } else {
                console.log(`[createEnrollment] Cupom inválido fornecido: ${cup}`);
            }
        }
        
        // Garante duas casas decimais
        valorCobrado = Number(valorCobrado.toFixed(2));
        
        console.log("[createEnrollment] Valor Final a Cobrar:", valorCobrado);
       
        // Flag para detectar mudança de valor (cupom aplicado/removido)
        let valorMudou = false;

        // 1. CRIA OU ATUALIZA O USUÁRIO NO BANCO COMO "PENDING" ANTES DO PAGAMENTO
        console.log("[createEnrollment] Preparando dados do aluno (PENDING)...");
        
        const cpfLimpo = cpf.replace(/\D/g, '');
        const alunoData = {
            name,
            email,
            cpf: cpfLimpo,
            phone,
            modality,
            amount: valorCobrado,
            status: 'PENDING'
        };
        console.log("[createEnrollment] Dados do aluno para DB:", alunoData);

        // Verifica se já existe
        console.log("[createEnrollment] Buscando aluno existente por Email ou CPF...");
        const alunoExistente = await prisma.enrollment.findFirst({
            where: { OR: [{ email: email }, { cpf: cpfLimpo }] }
        });

        let alunoId;

        if (alunoExistente) {
            console.log(`[createEnrollment] Aluno encontrado (ID: ${alunoExistente.id}).`);

            // Verifica se o valor mudou (ex: cupom aplicado ou removido)
            valorMudou =
                Number(alunoExistente.amount) !== Number(valorCobrado);

            if (valorMudou) {
                console.log('[createEnrollment] Valor alterado. Novo pagamento será necessário.');
            }
            
            // 1) Impedir sobrescrição de um PAID
            if (['PAID','ADMIN'].includes(alunoExistente.status)) {
                console.warn('[createEnrollment] Tentativa de criação/atualização para usuário já PAID.');
                return res.status(409).json({ error: 'Usuário já possui inscrição paga.' });
            }

            // 2) Se estiver PENDING e já tiver paymentId, verificar o estado no Mercado Pago
            if (alunoExistente.status === 'PENDING' && alunoExistente.paymentId) {
                try {
                    const payment = new Payment(client);
                    const existingMp = await payment.get({ id: alunoExistente.paymentId });
                    const mpStatus = existingMp.status;
                    console.log(`[createEnrollment] Status MP do paymentId ${alunoExistente.paymentId}:`, mpStatus);

                    // Se MP já aprovou, atualiza como PAID e retorna informação
                    if (mpStatus === 'approved') {
                        await prisma.enrollment.update({ where: { id: alunoExistente.id }, data: { status: 'PAID' } });

                        // Enviar email de boas-vindas
                        await sendWelcomeEmail(alunoExistente.email, alunoExistente.name);

                        return res.status(200).json({ resume: false, message: 'Pagamento já aprovado.' , status: 'approved' });
                    }

                    // Se pagamento ainda estiver em processamento/pendente, retornamos os dados para o frontend retomar
                    const resumableStates = ['pending', 'in_process', 'processing', 'pending_waiting_transfer'];
                    if (resumableStates.includes(mpStatus)) {

                        const modalidadeMudou = alunoExistente.modality !== modality;

                        if (modalidadeMudou || valorMudou) {
                            console.log('[createEnrollment] Novo pagamento necessário (modalidade ou valor mudou)');

                            try {
                                await prisma.enrollment.update({
                                    where: { id: alunoExistente.id },
                                    data: { status: 'REJECTED' }
                                });
                                console.log('[createEnrollment] Pagamento anterior marcado como REJECTED.');
                            } catch (err) {
                                console.error('[createEnrollment] Erro ao marcar REJECTED:', err.message);
                            }

                            // continua o fluxo para criar novo pagamento
                        } else {
                            return res.status(200).json({
                                resume: true,
                                paymentId: alunoExistente.paymentId,
                                status: mpStatus,
                                valor: alunoExistente.amount,
                                payment: {
                                    qrCodeBase64: existingMp.point_of_interaction?.transaction_data?.qr_code_base64,
                                    qrCodeCopyPaste: existingMp.point_of_interaction?.transaction_data?.qr_code,
                                }
                            });
                        }
                    }

                    // Se MP rejeitou definitivamente, marcamos REJECTED e deixamos seguir para criar novo pagamento
                    if (mpStatus === 'rejected' || mpStatus === 'cancelled' || mpStatus === 'refunded') {
                        console.log(`[createEnrollment] Pagamento anterior (${alunoExistente.paymentId}) com status ${mpStatus}. Marcando como REJECTED.`);
                        await prisma.enrollment.update({ where: { id: alunoExistente.id }, data: { status: 'REJECTED' } });
                        // prosseguir criando novo pagamento abaixo
                    }
                } catch (err) {
                    console.error('[createEnrollment] Erro ao consultar MP para paymentId existente:', err.message);
                }
            }

            // Atualiza (ou re-tenta) criando um novo registro de tentativa
            console.log('[createEnrollment] Atualizando dados do aluno para nova tentativa...');
            const updated = await prisma.enrollment.update({ where: { id: alunoExistente.id }, data: alunoData });
            alunoId = updated.id;
            console.log('[createEnrollment] Aluno atualizado com sucesso.');

        } else {
            console.log('[createEnrollment] Aluno não encontrado. Criando novo registro...');
            const created = await prisma.enrollment.create({ data: alunoData });
            alunoId = created.id;
            console.log(`[createEnrollment] Aluno criado com sucesso. ID: ${alunoId}`);
        }

        // 2. GERA O PAGAMENTO NO MERCADO PAGO
        console.log("[createEnrollment] Iniciando integração com Mercado Pago...");
        const payment = new Payment(client);

        let paymentData = {
            transaction_amount: valorCobrado,
            description: `Curso Matemática - ${modality}`,
            payer: {
                email: email,
                first_name: name.split(" ")[0],
                identification: { type: 'CPF', number: cpfLimpo }
            },
            metadata: { name, email, cpf: cpfLimpo, phone, modality, alunoId } // Passamos o ID do aluno no metadata
        };
        console.log("[createEnrollment] Payload para Mercado Pago:", JSON.stringify(paymentData, null, 2));

        // --- SELEÇÃO DO MÉTODO ---
        if (paymentMethod === 'cartao') {
            // Validação simples de 'installments' (deve ser inteiro entre 1 e 12)
            const parcelas = Number(installments) || 1;
            if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) {
                console.warn('[createEnrollment] installments inválido:', installments);
                return res.status(400).json({ error: 'Parâmetro installments inválido. Deve ser inteiro entre 1 e 12.' });
            }

            paymentData.token = token; // Token seguro
            paymentData.installments = parcelas; // 1 a 12
            paymentData.payment_method_id = paymentMethodId; // 'visa', 'master', etc. (Vem do Front)

        } else if (paymentMethod === 'boleto') {
            paymentData.payment_method_id = 'bolbradesco';
        } else {
            paymentData.payment_method_id = 'pix';
        }

        const mpResponse = await payment.create({ body: paymentData });
        console.log("[createEnrollment] Resposta do Mercado Pago:", mpResponse.status, mpResponse.id);

        // 3. ATUALIZA O USUÁRIO COM O ID DO PAGAMENTO
        console.log(`[createEnrollment] Vinculando PaymentID ${mpResponse.id} ao Aluno ${alunoId}...`);
        await prisma.enrollment.update({
            where: { id: alunoId },
            data: { paymentId: mpResponse.id.toString() }
        });
        console.log("[createEnrollment] Vínculo concluído.");

        //cartão rejeitado
        if (mpResponse.status === 'rejected') {
            console.warn("[createEnrollment] Pagamento rejeitado.");
            // Marca explicitamente como REJECTED no banco
            try {
                await prisma.enrollment.update({ where: { id: alunoId }, data: { status: 'REJECTED' } });
            } catch (err) {
                console.error('[createEnrollment] Erro ao marcar REJECTED no DB:', err.message);
            }
            return res.status(400).json({ error: "Pagamento rejeitado pelo banco. Verifique os dados ou limite." });
        }

        // Se o pagamento foi aprovado imediatamente (cartão), marca PAID e envia e-mail
                if (mpResponse.status === 'approved') {
            try {
                await prisma.enrollment.update({ where: { id: alunoId }, data: { status: 'PAID' } });
            } catch (err) {
                console.error('[createEnrollment] Erro ao marcar PAID no DB:', err.message);
            }
            try {
                // Obtemos os dados atuais do aluno para preencher o e-mail
                const aluno = await prisma.enrollment.findUnique({ where: { id: alunoId } });
                await sendWelcomeEmail(aluno.email, aluno.name);
            } catch (err) {
                console.error('[createEnrollment] Erro ao enviar e-mail após aprovação imediata:', err.message);
            }
        }

        res.status(201).json({
            success: true,
            paymentId: mpResponse.id.toString(),
            status: mpResponse.status,
            valor: valorCobrado,
            payment: {
                // Dados para PIX
                qrCodeBase64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
                qrCodeCopyPaste: mpResponse.point_of_interaction?.transaction_data?.qr_code,
            }
        });

    } catch (error) {
        console.error("[createEnrollment] ERRO FATAL:", error);
        if (error.response) {
             console.error("[createEnrollment] Detalhes do erro MP:", JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ error: "Erro ao processar pagamento.", details: error.message });
    }
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Consulta o Mercado Pago
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: id });
        const status = paymentInfo.status;

        // --- ÁREA DE DEBUG (OLHE O TERMINAL APÓS PAGAR!) ---
        if (status === 'approved') {
            console.log("Pagamento Aprovado! ID:", id);
        }
        // ----------------------------------------

        // 2. Se não for aprovado, encerra aqui
        if (status !== 'approved') {
            return res.json({ status: status });
        }

        // 3. Verifica se JÁ salvamos esse pagamento específico pelo ID
        // Como agora salvamos o paymentId na criação, buscamos por ele
        const existingPayment = await prisma.enrollment.findFirst({
            where: { paymentId: id }
        });

        if (existingPayment && ['PAID','ADMIN'].includes(existingPayment.status)) {
            return res.json({ status: status, message: "Pagamento já processado." }); 
        }

        if (existingPayment) {
            // 4. ATUALIZA O STATUS PARA PAID (garantir paymentId também)
            console.log("Confirmando pagamento para aluno:", existingPayment.email);
            try {
                await prisma.enrollment.update({
                    where: { id: existingPayment.id },
                    data: { status: 'PAID', paymentId: id }
                });
                
                // Enviar email de boas-vindas
                await sendWelcomeEmail(existingPayment.email, existingPayment.name);

            } catch (err) {
                console.error('[checkPaymentStatus] Erro ao marcar PAID no DB:', err.message);
            }
        } else {
            // Fallback: Se por algum motivo o registro não existir (ex: criado antes dessa mudança),
            // tentamos criar/atualizar usando o metadata como antes.
            console.warn("Aluno não encontrado pelo PaymentID. Tentando recuperar via Metadata...");
            
            const userData = paymentInfo.metadata || {};
            const novoAluno = {
                name: userData.name || "Aluno Sem Nome",
                email: userData.email, 
                cpf: userData.cpf,
                phone: userData.phone || "",
                modality: userData.modality || "SEM_MATERIAL", 
                amount: paymentInfo.transaction_amount || 0,
                status: 'PAID',
                paymentId: id
            };

            const alunoExistente = await prisma.enrollment.findFirst({
                where: { OR: [{ email: novoAluno.email }, { cpf: novoAluno.cpf }] }
            });

            if (alunoExistente) {
                await prisma.enrollment.update({
                    where: { id: alunoExistente.id },
                    data: novoAluno
                });
            } else {
                await prisma.enrollment.create({
                    data: novoAluno
                });
            }
            // Enviar email de boas-vindas no fluxo de fallback
            await sendWelcomeEmail(novoAluno.email, novoAluno.name);
        }

        res.json({ status: status, message: "Matrícula confirmada!" });

    } catch (error) {
        // ESSE LOG VAI TE CONTAR A VERDADE NO TERMINAL
        console.error("ERRO NO BACKEND:", error.message);
        if (error.code) console.error("Código do Erro Prisma:", error.code);
        
        res.status(500).json({ error: "Erro ao processar matrícula", details: error.message });
    }
};

//no cadastro, verifica se já existe inscrição com cpf ou email
export const getExistingEnrollment = async (req, res) => {
    try {
        const { cpf, email } = req.query;
        if (!cpf && !email) return res.status(400).json({ error: 'cpf or email required' });

        const cpfLimpo = cpf ? String(cpf).replace(/\D/g, '') : undefined;

        const found = await prisma.enrollment.findFirst({
            where: { OR: [{ email: email || undefined }, { cpf: cpfLimpo || undefined }] }
        });

        if (!found) return res.json({ exists: false });

        return res.json({
            exists: true,
            status: found.status,
            modality: found.modality,
            paymentId: found.paymentId || null,
            amount: found.amount || null
        });
    } catch (err) {
        console.error('[getExistingEnrollment] Erro:', err.message);
        res.status(500).json({ error: 'Erro ao consultar inscrição existente' });
    }
};


//Verificação de Login


export const verifyLogin = async (req, res) => {
    try {
        const { email, pass } = req.body;

        if (!email) return res.status(400).json({ error: "E-mail é obrigatório." });
        if (pass === undefined || pass === null) return res.status(400).json({ error: "Senha é obrigatória." });

        const user = await prisma.enrollment.findUnique({ where: { email: email }});
        if (!user) {
            return res.status(404).json({ error: "E-mail não encontrado." })
        };

        // Remove formatação do CPF antes de comparar
        const passLimpo = String(pass).replace(/\D/g, '');
        if (user.cpf !== passLimpo) {
            return res.status(401).json({ error: "Senha incorreta." });
        };
                
        if (!user.status || !['PAID','ADMIN'].includes(user.status)) {
            return res.status(403).json({ error: "Seu pagamento ainda não foi confirmado." });
        }

        // Atualizar Último Acesso
        try {
            await prisma.enrollment.update({ where: { id: user.id }, data: { lastAccess: new Date() } });
        } catch(e) { console.error('Error updating lastAccess', e); }

        // Gerar tokens e setar cookies para compatibilidade com novo fluxo
        const accessToken = signAccess(user.id);
        const refreshToken = signRefresh(user.id);
        const secure = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge: ACCESS_EXPIRES * 1000,
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge: REFRESH_EXPIRES * 1000,
            path: '/'
        });

        return res.status(200).json({ 
            success: true, 
            message: "Login bem-sucedido.",
            userId: user.id,
            userName: user.name,
            status: user.status,
            modality: user.modality // Retornar modalidade para o frontend usar
        });
    }
    catch (err) {
        console.error('[verifyLogin] Erro:', err.message);
        console.error(err.stack); // Log do stack trace
        res.status(500).json({ error: 'Erro ao verificar login', details: err.message });
    }
};

// Lista alunos com status PAID (para uso no painel administrativo)
export const listPaidEnrollments = async (req, res) => {
    try {
        const q = req.query.q ? String(req.query.q).trim() : '';
        const modality = req.query.modality ? String(req.query.modality).trim() : '';
        const classDay = req.query.classDay ? String(req.query.classDay).trim() : '';

        // Base: sempre filtrar por status PAID ou ADMIN
        let whereClause = { status: { in: ['PAID','ADMIN'] } };

        // Se houver busca por nome, adicionar OR
        if (q) {
            whereClause.OR = [
                { name: { startsWith: q } },
                { name: { contains: ' ' + q } }
            ];
        }

        // Se modalidade fornecida, adicionar filtro (AND)
        if (modality) {
            whereClause.modality = modality;
        }

        // Se dia da aula fornecido, adicionar filtro (AND)
        if (classDay) {
            whereClause.classDay = classDay;
        }

        const students = await prisma.enrollment.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            take: 200,
            select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                phone: true,
                modality: true,
                amount: true,
                createdAt: true,
                lastAccess: true,
                classDay: true
            }
        });

        // Compute real lessons-watched percentage per student
        const ids = students.map(s => s.id);

        // Determine total lessons (dynamically)
        const totalLessons = await countVimeoIds();

        let completedMap = {};
        if (ids.length > 0) {
            try {
                const grouped = await prisma.lessonProgress.groupBy({
                    by: ['enrollmentId'],
                    where: { enrollmentId: { in: ids }, status: 'COMPLETED' },
                    _count: { _all: true }
                });
                grouped.forEach(g => { completedMap[String(g.enrollmentId)] = g._count._all || 0; });
            } catch (e) {
                // If groupBy isn't supported or fails, silently continue with zeros
                console.warn('[listPaidEnrollments] groupBy failed, skipping progress counts', e.message || e);
            }
        }

        const studentsWithProgress = students.map(s => {
            const completed = completedMap[String(s.id)] || 0;
            const lessonsPercent = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
            return Object.assign({}, s, { lessonsCompleted: completed, lessonsPercent });
        });

        return res.json(studentsWithProgress);
    } catch (err) {
        console.error('[listPaidEnrollments] Erro:', err);
        console.error(err.stack);
        // Em ambiente de desenvolvimento, devolver detalhes; em produção, manter mensagem genérica
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: 'Erro ao buscar alunos pagos', details: isDev ? (err.message || String(err)) : undefined });
    }
};

// Resumo: total de inscritos e quantos estão PAID
export const enrollmentSummary = async (req, res) => {
    try {
        const paidCount = await prisma.enrollment.count({ where: { status: { in: ['PAID','ADMIN'] } } });
        const totalCount = await prisma.enrollment.count();
        const percent = totalCount ? Math.round((paidCount / totalCount) * 100) : 0;
        // Calculate average lessons completion percent for PAID students
        let averageLessonsPercent = 0;
        try {
            if (paidCount > 0) {
                const paidStudents = await prisma.enrollment.findMany({ where: { status: { in: ['PAID','ADMIN'] } }, select: { id: true } });
                const ids = paidStudents.map(s => s.id);

                // Determine totalLessons
                const totalLessons = await countVimeoIds();

                let completedMap = {};
                if (ids.length > 0) {
                    try {
                        const grouped = await prisma.lessonProgress.groupBy({
                            by: ['enrollmentId'],
                            where: { enrollmentId: { in: ids }, status: 'COMPLETED' },
                            _count: { _all: true }
                        });
                        grouped.forEach(g => { completedMap[String(g.enrollmentId)] = g._count._all || 0; });
                    } catch (e) {
                        console.warn('[enrollmentSummary] groupBy failed, skipping progress counts', e.message || e);
                    }
                }

                // Compute per-student percent and average
                const percents = ids.map(id => {
                    const completed = completedMap[String(id)] || 0;
                    return totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
                });

                const sum = percents.reduce((a, b) => a + b, 0);
                averageLessonsPercent = percents.length ? Math.round(sum / percents.length) : 0;
            }
        } catch (e) {
            console.warn('[enrollmentSummary] erro ao calcular média de conclusão:', e.message || e);
            averageLessonsPercent = 0;
        }

        return res.json({ paidCount, totalCount, percent, averageLessonsPercent });
    } catch (err) {
        console.error('[enrollmentSummary] Erro:', err);
        return res.status(500).json({ error: 'Erro ao calcular resumo de inscrições', details: process.env.NODE_ENV !== 'production' ? String(err) : undefined });
    }
};

export const createEnrollmentByAdmin = async (req, res) => {
    try {
        // req.enrollment vem do middleware requireAuth
        if (req.enrollment.status !== 'ADMIN') {
             return res.status(403).json({ error: 'Apenas administradores podem realizar esta ação.' });
        }

        const { name, email, cpf, phone, modality } = req.body;

        if (!name || !email || !cpf) {
            return res.status(400).json({ error: 'Nome, Email e CPF são obrigatórios.' });
        }
        
        const cleanCpf = String(cpf).replace(/\D/g, '');

        const existing = await prisma.enrollment.findFirst({
            where: {
                OR: [
                    { email: email },
                    { cpf: cleanCpf }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Já existe um aluno com este Email ou CPF.' });
        }

        const newStudent = await prisma.enrollment.create({
            data: {
                name,
                email,
                cpf: cleanCpf,
                phone: phone || '', // Phone cannot be null in schema
                modality: modality || 'Extensivo',
                amount: 0.0,
                status: 'PAID',
                birthDate: null,
            }
        });

        // Enviar emails: primeiro Boas-vindas, depois Credenciais
        // Não awaitamos para não bloquear o retorno da requisição, ou awaitamos se quisermos garantir envio?
        // Como é admin, melhor esperar para garantir que foi enviado.
        await sendWelcomeEmail(email, name);
        await sendCredentialsEmail(email, name, cleanCpf);

        return res.status(201).json({ success: true, student: newStudent });

    } catch (error) {
        console.error("[createEnrollmentByAdmin] Erro:", error);
        return res.status(500).json({ error: 'Erro interno ao criar aluno.' });
    }
};
export const updateStudentModality = async (req, res) => {
    try {
        console.log("[updateStudentModality] Iniciando atualização de modalidade...");
        if (!req.enrollment || req.enrollment.status !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem realizar esta ação.' });
        }

        const { cpf, modality } = req.body;

        if (!cpf || !modality) {
            return res.status(400).json({ error: 'CPF e Nova Modalidade são obrigatórios.' });
        }

        const cleanCpf = String(cpf).replace(/\D/g, '');

        const student = await prisma.enrollment.findUnique({
            where: { cpf: cleanCpf }
        });

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado com este CPF.' });
        }

        const updatedStudent = await prisma.enrollment.update({
            where: { cpf: cleanCpf },
            data: { modality }
        });

        console.log(`[updateStudentModality] Modalidade do aluno ${student.name} (${cleanCpf}) alterada para ${modality}.`);

        return res.json({ success: true, message: 'Modalidade atualizada com sucesso.', student: updatedStudent });

    } catch (error) {
        console.error('[updateStudentModality] Erro:', error);
        return res.status(500).json({ error: 'Erro ao atualizar modalidade.', details: error.message });
    }
};
