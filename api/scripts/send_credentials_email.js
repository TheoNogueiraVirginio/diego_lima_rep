import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { sendCredentialsEmail } from '../src/services/emailService.js';

// Carregar variáveis de ambiente do .env na raiz da api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Iniciando script de envio de CREDENCIAIS em massa...");

    // 1. Validar Credenciais
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error("❌ Credenciais GMAIL_USER ou GMAIL_PASS não encontradas no .env");
        process.exit(1);
    }

    // 2. Buscar Alunos (Status PAID e NÃO ADMIN)
    const students = await prisma.enrollment.findMany({
        where: {
            status: 'PAID' 
        },
        select: {
            id: true,
            email: true,
            name: true,
            cpf: true,
            status: true
        }
    });

    console.log(`📋 Total de alunos 'PAID' encontrados: ${students.length}`);

    // --- SEGURANÇA: MODO DE EXECUÇÃO ---
    // Use --send para enviar de fato.
    // Use --resume-after "Nome Completo" para continuar.
    const MODE = process.argv.includes('--send') ? 'SEND' : 'DRY_RUN';
    
    // Lógica de Retomada
    const resumeArgIndex = process.argv.indexOf('--resume-after');
    const resumeAfterName = resumeArgIndex !== -1 ? process.argv[resumeArgIndex + 1] : null;

    if (students.length === 0) {
        console.log("⚠️ Nenhum aluno para enviar.");
        return;
    }

    console.log(`🔒 Modo de Execução: ${MODE}`);

    if (resumeAfterName) {
        console.log(`⏩ Configurado para retomar APÓS: "${resumeAfterName}"`);
    }
    
    if (MODE !== 'SEND') {
        console.log("\n⚠️ ATENÇÃO: Os e-mails NÃO estão sendo enviados (Modo Simulação).");
        console.log("⚠️ Para enviar de fato, execute: node scripts/send_credentials_email.js --send\n");
    }

    let successCount = 0;
    let errorCount = 0;
    let skipping = !!resumeAfterName;

    console.log("Iniciando processamento...\n");

    for (const student of students) {
         if (skipping) {
            // Se encontrar o nome exato, paramos de pular NA PRÓXIMA iteração
            if (student.name === resumeAfterName) {
                console.log(`📍 Encontrado último enviado: ${student.name}. Retomando envios a partir do PRÓXIMO.`);
                skipping = false;
            }
            continue;
        }

        if (MODE === 'SEND') {
            process.stdout.write(`Enviando credenciais para ${student.email} (${student.name})... `);
            const sent = await sendCredentialsEmail(student.email, student.name, student.cpf);
            if (sent) {
                successCount++;
            } else {
                errorCount++;
            }
        } else {
            console.log(`[SIMULAÇÃO] Enviaria credenciais para: ${student.email} (Senha: CPF ${student.cpf.replace(/\D/g, '')})`);
            successCount++; 
        }

        // Delay para evitar bloqueio do Gmail
        if (MODE === 'SEND') await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n=========================================");
    console.log(`🏁 Finalizado!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log("=========================================");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
