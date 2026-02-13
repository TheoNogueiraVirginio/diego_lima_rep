import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { sendWelcomeEmail } from '../src/services/emailService.js';

// Carregar variáveis de ambiente do .env na raiz da api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando script de envio de email em massa...");

    // 1. Validar Credenciais
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error("Credenciais GMAIL_USER ou GMAIL_PASS não encontradas no .env");
        process.exit(1);
    }

    // 2. Buscar Alunos
    // EMERGENCIAL: Enviando apenas para os novos alunos importados hoje (11/02)
    const TARGET_EMAILS = [
        'giogouveia990@gmail.com',
    ];

    const students = await prisma.enrollment.findMany({
        where: {
            email: { in: TARGET_EMAILS }
        },
        select: {
            id: true,
            email: true,
            name: true,
            status: true
        }
    });

    console.log(`Total de alunos 'PAID' encontrados: ${students.length}`);

    // --- SEGURANÇA: MODO DE EXECUÇÃO ---
    // Altere para 'SEND' para enviar de fato.
    // Use --resume-after "Nome Completo" para continuar após um aluno específico
    const MODE = process.argv.includes('--send') ? 'SEND' : 'DRY_RUN';
    
    // Lógica de Retomada
    const resumeArgIndex = process.argv.indexOf('--resume-after');
    const resumeAfterName = resumeArgIndex !== -1 ? process.argv[resumeArgIndex + 1] : null;

    if (students.length === 0) {
        console.log("Nenhum aluno para enviar.");
        return;
    }

    console.log(`Modo de Execução: ${MODE}`);

    if (resumeAfterName) {
        console.log(`⏩ Configurado para retomar APÓS: "${resumeAfterName}"`);
    }
    
    if (MODE !== 'SEND') {
        console.log("\nATENÇÃO: Os e-mails NÃO estão sendo enviados (Modo Simulação).");
        console.log("Para enviar de fato, execute: node scripts/send_broadcast_email.js --send\n");
    }

    let successCount = 0;
    let errorCount = 0;
    let skipping = !!resumeAfterName;

    console.log("Iniciando processamento...\n");

    for (const student of students) {
        if (skipping) {
            // Se encontrar o nome exato, paramos de pular NA PRÓXIMA iteração (ou seja, pulamos este também pois já foi enviado)
            if (student.name === resumeAfterName) {
                console.log(`Encontrado último enviado: ${student.name}. Retomando envios a partir do PRÓXIMO.`);
                skipping = false;
            }
            continue;
        }

        if (MODE === 'SEND') {
            process.stdout.write(`Envianado para ${student.email} (${student.name})... `);
            const sent = await sendWelcomeEmail(student.email, student.name);
            if (sent) {
                successCount++;
            } else {
                errorCount++;
            }
        } else {
            console.log(`[SIMULAÇÃO] Enviaria para: ${student.email} (${student.name})`);
            successCount++; // Contamos como sucesso na simulação
        }

        // Delay para evitar bloqueio do Gmail (opcional, mas recomendado)
        if (MODE === 'SEND') await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n=========================================");
    console.log(`Finalizado!`);
    console.log(`Sucessos: ${successCount}`);
    console.log(`Erros: ${errorCount}`);
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
