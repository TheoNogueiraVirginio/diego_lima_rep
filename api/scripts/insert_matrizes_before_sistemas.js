import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function normalize(s){
    return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const NEW_SUBJECT = 'Matrizes e Determinantes';
const MODULE_ID = 3;
const SISTEMAS_KEYWORDS = ['sistemas linear', 'sistemas lineares', 'sistemas linear'];

async function main(){
    console.log('Buscando ordem atual de "Sistemas" no módulo', MODULE_ID);
    const all = await prisma.videoLesson.findMany({ where: { module: MODULE_ID }, select: { id: true, subjectName: true, subjectOrder: true } });
    if(!all || all.length === 0){
        console.log('Nenhuma aula encontrada para module=3. Abortando.');
        return;
    }

    const targetSistemas = all.filter(l => {
        const n = normalize(l.subjectName || '');
        return SISTEMAS_KEYWORDS.some(k => n.includes(normalize(k)));
    });

    let targetOrder = null;
    if(targetSistemas.length > 0){
        // escolher o menor subjectOrder entre os que correspondem a sistemas
        targetOrder = Math.min(...targetSistemas.map(x => x.subjectOrder)) ;
        console.log('Encontrado subjectOrder de Sistemas:', targetOrder);
    } else {
        // se não encontrado, colocar antes do último assunto
        const maxOrder = Math.max(...all.map(x => x.subjectOrder || 0));
        targetOrder = maxOrder + 1; // append at end
        console.log('Assunto "Sistemas" não encontrado, novo assunto será inserido ao final com ordem', targetOrder);
    }

    // normalizar nome novo
    const normalizedNew = normalize(NEW_SUBJECT);
    const exists = all.filter(l => normalize(l.subjectName || '') === normalizedNew);
    if(exists.length > 0){
        console.log(`Assunto "${NEW_SUBJECT}" já existe no DB (subjectOrder=${exists[0].subjectOrder}). Atualizando posição para ${targetOrder}...`);

        // se já existir, precisamos mover outros registros para abrir espaço na posição targetOrder
        await prisma.videoLesson.updateMany({ where: { module: MODULE_ID, subjectOrder: { gte: targetOrder } }, data: { subjectOrder: { increment: 1 } } });

        const res = await prisma.videoLesson.updateMany({ where: { module: MODULE_ID, subjectName: exists[0].subjectName }, data: { subjectOrder: targetOrder } });
        console.log(`Atualizados ${res.count} linhas para mover o assunto existente.`);
        console.log('Concluído.');
        return;
    }

    // mover todos com subjectOrder >= targetOrder para +1
    console.log('Deslocando assuntos com subjectOrder >=', targetOrder, 'para abrir espaço...');
    const moved = await prisma.videoLesson.updateMany({ where: { module: MODULE_ID, subjectOrder: { gte: targetOrder } }, data: { subjectOrder: { increment: 1 } } });
    console.log(`Registros deslocados: ${moved.count}`);

    // criar uma lição placeholder representando o assunto
    const createData = {
        module: MODULE_ID,
        subjectOrder: targetOrder,
        subjectName: NEW_SUBJECT,
        lessonOrder: 0,
        title: NEW_SUBJECT,
        vimeoId: '',
        duration: 0
    };

    const created = await prisma.videoLesson.create({ data: createData });
    console.log('Criado novo registro para o assunto:', created.id, 'subjectOrder:', created.subjectOrder);
    console.log('Operação concluída.');
}

main().catch(e => console.error('Erro:', e)).finally(() => prisma.$disconnect());
