import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

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
    const totalAlunosPagos = await prisma.enrollment.count({ where: { status: 'PAID' } });
    const agora = new Date();

    // A partir de agora sempre retornar o preço da TIER_3 como padrão.
    // Mantemos as outras regras/valores no código para histórico/futuro uso.
    const valorFinal = (modalidade === 'COM_MATERIAL') ? PRECOS.TIER_3.COM : PRECOS.TIER_3.SEM;
    return valorFinal;
}

// --- Envio de e-mail (nodemailer) ---
async function sendEnrollmentEmail(toEmail, studentName, modality, amount) {
    try {
        // Configuração simplificada: usar apenas GMAIL_USER e GMAIL_PASS
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_PASS;
        const fromAddress = process.env.SMTP_FROM || gmailUser || 'no-reply@seusite.com';

        if (!gmailUser || !gmailPass) {
            console.warn('⚠️ [sendEnrollmentEmail] Credenciais Gmail não configuradas. Logando o e-mail no console como fallback.');
            console.log(`Email para: ${toEmail}\nAssunto: Matrícula confirmada\nCorpo: Olá ${studentName}, sua matrícula na modalidade ${modality} foi confirmada. Valor: R$ ${Number(amount).toFixed(2)}.`);
            return;
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: gmailUser,
                pass: gmailPass
            }
        });

        const subject = 'Confirmação de Matrícula - Curso de Matemática';
        const html = `
            <p>Olá ${studentName},</p>
            <p>Seu pagamento foi confirmado e sua matrícula na modalidade <strong>${modality}</strong> foi finalizada com sucesso.</p>
            <p><strong>Valor:</strong> R$ ${Number(amount).toFixed(2)}</p>
            <p>Em breve entraremos em contato com as instruções de acesso ao material.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Diego Lima Cursos</p>
        `;

        await transporter.sendMail({
            from: fromAddress,
            to: toEmail,
            subject,
            html
        });

        console.log(`✅ [sendEnrollmentEmail] E-mail enviado para ${toEmail}`);

    } catch (err) {
        console.error('❌ [sendEnrollmentEmail] Erro ao enviar e-mail:', err.message);
    }
}

export const createEnrollment = async (req, res) => {
    try {
        console.log("🚀 [createEnrollment] Iniciando processamento...");
        // Recebemos 'paymentMethodId' (visa/master), 'token' e agora 'coupon' do frontend
        const { name, email, cpf, phone, modality, paymentMethod, installments, token, paymentMethodId, coupon } = req.body;
        
        console.log("📦 [createEnrollment] Body recebido:", JSON.stringify({ name, email, cpf, phone, modality, paymentMethod, coupon }, null, 2));

        if (!modality) {
            console.error("❌ [createEnrollment] Modalidade não fornecida.");
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

            // aceitar somente "MARIALUIZA" (sem variante com Z)
            if (cup === 'MARIALUIZA') {
                console.log("🎟️ [createEnrollment] Cupom aplicado: MariaLuiza (preço fixo R$799.00)");
                valorCobrado = 799.00; // Valor final fixo para ambas as modalidades
            } else if (cup === 'MARIANALIMA') {
                console.log("🎟️ [createEnrollment] Cupom aplicado: MARIANALIMA (15% OFF)");
                valorCobrado = valorCobrado * 0.85; // Aplica 15% de desconto
            }
        }
        
        // Garante duas casas decimais
        valorCobrado = Number(valorCobrado.toFixed(2));
        
        console.log("💰 [createEnrollment] Valor Final a Cobrar:", valorCobrado);
       
        // 🔎 Flag para detectar mudança de valor (cupom aplicado/removido)
        let valorMudou = false;

        // 1. CRIA OU ATUALIZA O USUÁRIO NO BANCO COMO "PENDING" ANTES DO PAGAMENTO
        console.log("📝 [createEnrollment] Preparando dados do aluno (PENDING)...");
        
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
        console.log("👤 [createEnrollment] Dados do aluno para DB:", alunoData);

        // Verifica se já existe
        console.log("🔍 [createEnrollment] Buscando aluno existente por Email ou CPF...");
        const alunoExistente = await prisma.enrollment.findFirst({
            where: { OR: [{ email: email }, { cpf: cpfLimpo }] }
        });

        let alunoId;

        if (alunoExistente) {
            console.log(`🔄 [createEnrollment] Aluno encontrado (ID: ${alunoExistente.id}).`);

            // 🔎 Verifica se o valor mudou (ex: cupom aplicado ou removido)
            valorMudou =
                Number(alunoExistente.amount) !== Number(valorCobrado);

            if (valorMudou) {
                console.log('💸 [createEnrollment] Valor alterado. Novo pagamento será necessário.');
            }
            
            // 1) Impedir sobrescrição de um PAID
            if (alunoExistente.status === 'PAID') {
                console.warn('⚠️ [createEnrollment] Tentativa de criação/atualização para usuário já PAID.');
                return res.status(409).json({ error: 'Usuário já possui inscrição paga.' });
            }

            // 2) Se estiver PENDING e já tiver paymentId, verificar o estado no Mercado Pago
            if (alunoExistente.status === 'PENDING' && alunoExistente.paymentId) {
                try {
                    const payment = new Payment(client);
                    const existingMp = await payment.get({ id: alunoExistente.paymentId });
                    const mpStatus = existingMp.status;
                    console.log(`🔎 [createEnrollment] Status MP do paymentId ${alunoExistente.paymentId}:`, mpStatus);

                    // Se MP já aprovou, atualiza como PAID e retorna informação
                    if (mpStatus === 'approved') {
                        await prisma.enrollment.update({ where: { id: alunoExistente.id }, data: { status: 'PAID' } });
                        // Enviar email de confirmação
                        try {
                            await sendEnrollmentEmail(alunoExistente.email, alunoExistente.name, alunoExistente.modality, alunoExistente.amount);
                        } catch (e) {
                            console.error('❌ Erro ao enviar e-mail após detectar pagamento aprovado:', e.message);
                        }
                        return res.status(200).json({ resume: false, message: 'Pagamento já aprovado.' , status: 'approved' });
                    }

                    // Se pagamento ainda estiver em processamento/pendente, retornamos os dados para o frontend retomar
                    const resumableStates = ['pending', 'in_process', 'processing', 'pending_waiting_transfer'];
                    if (resumableStates.includes(mpStatus)) {

                        const modalidadeMudou = alunoExistente.modality !== modality;

                        if (modalidadeMudou || valorMudou) {
                            console.log('🔁 [createEnrollment] Novo pagamento necessário (modalidade ou valor mudou)');

                            try {
                                await prisma.enrollment.update({
                                    where: { id: alunoExistente.id },
                                    data: { status: 'REJECTED' }
                                });
                                console.log('✅ [createEnrollment] Pagamento anterior marcado como REJECTED.');
                            } catch (err) {
                                console.error('❌ [createEnrollment] Erro ao marcar REJECTED:', err.message);
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
                        console.log(`⚠️ [createEnrollment] Pagamento anterior (${alunoExistente.paymentId}) com status ${mpStatus}. Marcando como REJECTED.`);
                        await prisma.enrollment.update({ where: { id: alunoExistente.id }, data: { status: 'REJECTED' } });
                        // prosseguir criando novo pagamento abaixo
                    }

                } catch (err) {
                    console.error('❌ [createEnrollment] Erro ao consultar MP para paymentId existente:', err.message);
                    // Em caso de erro ao consultar MP, prosseguir com a criação/atualização normalmente
                }
            }

            // Atualiza (ou re-tenta) criando um novo registro de tentativa
            console.log('🔄 [createEnrollment] Atualizando dados do aluno para nova tentativa...');
            const updated = await prisma.enrollment.update({ where: { id: alunoExistente.id }, data: alunoData });
            alunoId = updated.id;
            console.log('✅ [createEnrollment] Aluno atualizado com sucesso.');

        } else {
            console.log('✨ [createEnrollment] Aluno não encontrado. Criando novo registro...');
            const created = await prisma.enrollment.create({ data: alunoData });
            alunoId = created.id;
            console.log(`✅ [createEnrollment] Aluno criado com sucesso. ID: ${alunoId}`);
        }

        // 2. GERA O PAGAMENTO NO MERCADO PAGO
        console.log("💳 [createEnrollment] Iniciando integração com Mercado Pago...");
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
        console.log("📤 [createEnrollment] Payload para Mercado Pago:", JSON.stringify(paymentData, null, 2));

        // --- SELEÇÃO DO MÉTODO ---
        if (paymentMethod === 'cartao') {
            // Validação simples de 'installments' (deve ser inteiro entre 1 e 12)
            const parcelas = Number(installments) || 1;
            if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) {
                console.warn('⚠️ [createEnrollment] installments inválido:', installments);
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
        console.log("📥 [createEnrollment] Resposta do Mercado Pago:", mpResponse.status, mpResponse.id);

        // 3. ATUALIZA O USUÁRIO COM O ID DO PAGAMENTO
        console.log(`🔗 [createEnrollment] Vinculando PaymentID ${mpResponse.id} ao Aluno ${alunoId}...`);
        await prisma.enrollment.update({
            where: { id: alunoId },
            data: { paymentId: mpResponse.id.toString() }
        });
        console.log("✅ [createEnrollment] Vínculo concluído.");

        //cartão rejeitado
        if (mpResponse.status === 'rejected') {
            console.warn("⚠️ [createEnrollment] Pagamento rejeitado.");
            // Marca explicitamente como REJECTED no banco
            try {
                await prisma.enrollment.update({ where: { id: alunoId }, data: { status: 'REJECTED' } });
            } catch (err) {
                console.error('❌ [createEnrollment] Erro ao marcar REJECTED no DB:', err.message);
            }
            return res.status(400).json({ error: "Pagamento rejeitado pelo banco. Verifique os dados ou limite." });
        }

        // Se o pagamento foi aprovado imediatamente (cartão), marca PAID e envia e-mail
        if (mpResponse.status === 'approved') {
            try {
                await prisma.enrollment.update({ where: { id: alunoId }, data: { status: 'PAID' } });
            } catch (err) {
                console.error('❌ [createEnrollment] Erro ao marcar PAID no DB:', err.message);
            }
            try {
                // Obtemos os dados atuais do aluno para preencher o e-mail
                const aluno = await prisma.enrollment.findUnique({ where: { id: alunoId } });
                await sendEnrollmentEmail(aluno.email, aluno.name, aluno.modality, aluno.amount);
            } catch (err) {
                console.error('❌ [createEnrollment] Erro ao enviar e-mail após aprovação imediata:', err.message);
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
        console.error("❌ [createEnrollment] ERRO FATAL:", error);
        if (error.response) {
             console.error("❌ [createEnrollment] Detalhes do erro MP:", JSON.stringify(error.response.data, null, 2));
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
            console.log("💰 Pagamento Aprovado! ID:", id);
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

        if (existingPayment && existingPayment.status === 'PAID') {
            return res.json({ status: status, message: "Pagamento já processado." }); 
        }

        if (existingPayment) {
            // 4. ATUALIZA O STATUS PARA PAID (garantir paymentId também)
            console.log("✅ Confirmando pagamento para aluno:", existingPayment.email);
            try {
                await prisma.enrollment.update({
                    where: { id: existingPayment.id },
                    data: { status: 'PAID', paymentId: id }
                });
            } catch (err) {
                console.error('❌ [checkPaymentStatus] Erro ao marcar PAID no DB:', err.message);
            }
            // Enviar e-mail de confirmação
            try {
                await sendEnrollmentEmail(existingPayment.email, existingPayment.name, existingPayment.modality, existingPayment.amount);
            } catch (err) {
                console.error('❌ Erro ao enviar e-mail após confirmação via polling:', err.message);
            }
        } else {
            // Fallback: Se por algum motivo o registro não existir (ex: criado antes dessa mudança),
            // tentamos criar/atualizar usando o metadata como antes.
            console.warn("⚠️ Aluno não encontrado pelo PaymentID. Tentando recuperar via Metadata...");
            
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
                try {
                    await sendEnrollmentEmail(alunoExistente.email || novoAluno.email, novoAluno.name, novoAluno.modality, novoAluno.amount);
                } catch (err) {
                    console.error('❌ Erro ao enviar e-mail após criar/atualizar via metadata:', err.message);
                }
            } else {
                await prisma.enrollment.create({
                    data: novoAluno
                });
                try {
                    await sendEnrollmentEmail(novoAluno.email, novoAluno.name, novoAluno.modality, novoAluno.amount);
                } catch (err) {
                    console.error('❌ Erro ao enviar e-mail após criar novo aluno via metadata:', err.message);
                }
            }
        }

        res.json({ status: status, message: "Matrícula confirmada!" });

    } catch (error) {
        // ESSE LOG VAI TE CONTAR A VERDADE NO TERMINAL
        console.error("❌ ERRO NO BACKEND:", error.message);
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
        console.error('❌ [getExistingEnrollment] Erro:', err.message);
        res.status(500).json({ error: 'Erro ao consultar inscrição existente' });
    }
};


//Verificação de Login

export const verifyLogin = async (req, res) => {
    try {
        console.log("vou pegar os emails")
        const { email, pass } = req.body;
        console.log("peguei os emails")
        const user = await prisma.enrollment.findUnique({ where: { email: email }});
        if (!user) {
            return res.status(404).json({ error: "E-mail não encontrado." })
        };

        // Remove formatação do CPF antes de comparar
        const passLimpo = pass.replace(/\D/g, '');
        if (user.cpf !== passLimpo) {
            return res.status(401).json({ error: "Senha incorreta." });
        };
                
        if (user.status !== 'PAID') {
             return res.status(403).json({ error: "Seu pagamento ainda não foi confirmado." });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Login bem-sucedido.",
            userId: user.id,
            userName: user.name
        });
    }
    catch (err) {
        console.error('❌ [verifyLogin] Erro:', err.message);
        res.status(500).json({ error: 'Erro ao verificar login' });
        };
};