import fs from 'fs';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importStudents() {
    const csvFilePath = './students.csv'; // Certifique-se de que o arquivo está na pasta api/

    if (!fs.existsSync(csvFilePath)) {
        console.error(`Arquivo ${csvFilePath} não encontrado. Por favor, exporte sua planilha como 'students.csv' e coloque na pasta 'api/'.`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let headerMap = {}; // { name: index, email: index... }
    let processingHeaders = true;
    let count = 0;
    let success = 0;
    let errors = 0;

    //comando para importar: node api/scripts/import_students.js
    // Defina aqui o email do aluno a partir do qual deseja começar (inclusivo)
    // Deixe vazio para processar todos
    const START_FROM_EMAIL = 'rnobregasorrentino@gmail.com'; 
    let foundStart = !START_FROM_EMAIL; // Se vazio, já começa true

    console.log('Iniciando importação...');

    for await (const line of rl) {
        // Ignora linhas vazias ou comentários (iniciados por # ou //)
        if (!line.trim() || line.trim().startsWith('#') || line.trim().startsWith('//')) continue;

        // Tenta dividir por vírgula ou ponto e vírgula (ajuste básico)
        // Se sua planilha usar virgula como separador decimal, o CSV costuma usar ponto e vírgula
        let cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Regex para separar por virgula ignorando virgulas dentro de aspas
        if (cols.length < 2) cols = line.split(';');

        cols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

        if (processingHeaders) {
            const lowerHeaders = cols.map(h => h.toLowerCase());
            
            // Busca dinâmica pelos indices das colunas
            headerMap.name = lowerHeaders.findIndex(h => h.includes('nome'));
            headerMap.cpf = lowerHeaders.findIndex(h => h.includes('cpf'));
            headerMap.email = lowerHeaders.findIndex(h => h.includes('email'));
            headerMap.modality = lowerHeaders.findIndex(h => h.includes('curso') || h.includes('modalidade'));
            headerMap.phone = lowerHeaders.findIndex(h => h.includes('telefone') || h.includes('celular') || h.includes('whatsapp'));

            const missing = [];
            if (headerMap.name === -1) missing.push('Nome');
            if (headerMap.email === -1) missing.push('Email');
            if (headerMap.cpf === -1) missing.push('CPF');
            // Modality pode ser opcional se quisermos forçar, mas o user disse que tem coluna Curso
            if (headerMap.modality === -1) missing.push('Curso/Modalidade');

            if (missing.length > 0) {
                console.error(`Erro: Não foi possível identificar as colunas: ${missing.join(', ')}`);
                console.log(`Cabeçalhos encontrados: ${cols.join(' | ')}`);
                process.exit(1);
            }

            console.log('Colunas identificadas:', headerMap);
            processingHeaders = false;
            continue;
        }

        const row = {
            name: cols[headerMap.name],
            email: cols[headerMap.email],
            cpf: cols[headerMap.cpf],
            modality: cols[headerMap.modality],
            phone: headerMap.phone !== -1 ? cols[headerMap.phone] : 'Não informado'
        };

        if (!foundStart) {
            if (row.email === START_FROM_EMAIL) {
                foundStart = true;
                console.log(`Encontrado ponto de partida: ${START_FROM_EMAIL}. Retomando processamento...`);
            } else {
                continue; 
            }
        }

        try {
            await processStudent(row);
            success++;
        } catch (error) {
            console.error(`Erro ao importar ${row.email || 'desconhecido'}: ${error.message}`);
            errors++;
        }
        count++;
    }

    console.log(`\nImportação finalizada!`);
    console.log(`Total processado: ${count}`);
    console.log(`Sucesso: ${success}`);
    console.log(`Erros: ${errors}`);
}

async function processStudent(row) {
    const name = row.name;
    const email = row.email;
    const cpf = row.cpf ? row.cpf.replace(/\D/g, '') : '';
    const rawModality = row.modality || 'Extensivo';
    const phone = row.phone;

    if (!email || !cpf) {
        throw new Error(`Dados incompletos: Email=${email}, CPF=${cpf}`);
    }

    // Normalização da modalidade se necessário
    let modality = rawModality;
    if (modality.toLowerCase().includes('extensivo')) modality = 'Extensivo';
    if (modality.toLowerCase().includes('aprofundamento')) modality = 'APROFUNDAMENTO';
    
    // Tratamento de CPF para senha (padrão legado)
    // O sistema usa o CPF limpo como senha se passwordHash for null

    await prisma.enrollment.upsert({
        where: { email },
        update: {
            // Se já existe, atualiza status para pago e modalidade?
            // Descomente linhas abaixo se quiser atualizar usuários existentes
            // status: 'PAID',
            // modality: modality
            // Ou apenas ignore
        },
        create: {
            name,
            email,
            cpf,
            phone,
            modality,
            amount: 0.0, // Importado, assumimos valor 0 ou ajuste conforme necessidade
            status: 'PAID', // Já entra como pago/ativo
            birthDate: null, // Opcional
            // passwordHash: null // Nulo = usa CPF para login
        }
    });
}

importStudents()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
