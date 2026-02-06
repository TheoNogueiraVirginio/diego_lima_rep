import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env na raiz da api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

// =================CONFIGURAÇÃO DA MENSAGEM=================
const EMAIL_SUBJECT = "Seu Assunto Aqui";
const EMAIL_HTML = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <!-- ESPAÇO PARA SUA MENSAGEM -->
        <p>Olá, {name}!</p>
        
        <p>Escreva aqui o conteúdo do seu e-mail...</p>

        <br>
        <p>Atenciosamente,<br>Prof. Diego Lima</p>
    </div>
`;
// ==========================================================

async function main() {
    console.log("🚀 Iniciando script de envio de email em massa...");

    // 1. Validar Credenciais
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (!gmailUser || !gmailPass) {
        console.error("❌ Credenciais GMAIL_USER ou GMAIL_PASS não encontradas no .env");
        process.exit(1);
    }

    // 2. Transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: gmailUser,
            pass: gmailPass
        }
    });

    // 3. Buscar Alunos (Status PAID e NÃO ADMIN)
    // Assumindo que status='PAID' já exclui 'ADMIN' (pois são valores mutuamente exclusivos no campo único status)
    const students = await prisma.enrollment.findMany({
        where: {
            status: 'PAID' 
        },
        select: {
            id: true,
            email: true,
            name: true,
            status: true
        }
    });

    console.log(`📋 Total de alunos 'PAID' encontrados: ${students.length}`);

    // --- SEGURANÇA: MODO DRY_RUN ---
    // Mude para 'SEND' apenas quando for realmente enviar.
    const MODE = 'DRY_RUN'; 

    if (students.length === 0) {
        console.log("⚠️ Nenhum aluno para enviar.");
        return;
    }

    console.log(`🔒 Modo de Execução: ${MODE}`);
    
    if (MODE !== 'SEND') {
        console.log("\n⚠️ ATENÇÃO: Os e-mails NÃO estão sendo enviados.");
        console.log("⚠️ Para enviar de fato, edite este script e mude a variável MODE para 'SEND'.\n");
    }

    let successCount = 0;
    let errorCount = 0;

    console.log("Iniciando processamento...\n");

    for (const student of students) {
        // Obter primeiro nome para personalização
        const firstName = student.name ? student.name.split(' ')[0] : 'Aluno';
        
        // Substituir placeholder no HTML
        const personalizedHtml = EMAIL_HTML.replace(/{name}/g, firstName);

        if (MODE === 'SEND') {
            try {
                process.stdout.write(`Envianado para ${student.email}... `);
                
                await transporter.sendMail({
                    from: `"Diego Lima Matemática" <${gmailUser}>`,
                    to: student.email,
                    subject: EMAIL_SUBJECT,
                    html: personalizedHtml
                });

                console.log("✅ OK");
                successCount++;

                // Pausa de 1s para evitar rate-limit agressivo
                await new Promise(r => setTimeout(r, 1000));

            } catch (err) {
                console.log(`❌ ERRO: ${err.message}`);
                errorCount++;
            }
        } else {
            console.log(`[SIMULAÇÃO] Enviaria para: ${student.email} (Nome: ${firstName})`);
        }
    }

    console.log("\n================ RESUMO ================");
    if (MODE === 'SEND') {
        console.log(`✅ Enviados com sucesso: ${successCount}`);
        console.log(`❌ Falhas: ${errorCount}`);
    } else {
        console.log(`Simulação finalizada. ${students.length} e-mails seriam enviados.`);
    }
}

main()
    .catch(e => {
        console.error("❌ Erro fatal no script:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
