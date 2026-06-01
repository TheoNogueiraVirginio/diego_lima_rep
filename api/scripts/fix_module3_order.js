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

const desiredOrder = [
    'Análise Combinatória',
    'Probabilidade',
    'Trigonometria',
    'Funções Trigonométricas',
    'Matrizes e determinantes',
    'Sistemas lineares'
];

async function main(){
    console.log('Procurando aulas do módulo 3...');
    const lessons = await prisma.videoLesson.findMany({ where: { module: 3 }, select: { id: true, subjectName: true, subjectOrder: true } });
    if(!lessons || lessons.length === 0){
        console.log('Nenhuma aula encontrada para module=3. Abortando.');
        return;
    }

    // map normalized subjectName -> array of original subjectName values
    const subjMap = new Map();
    lessons.forEach(l => {
        const n = normalize(l.subjectName || '');
        if(!subjMap.has(n)) subjMap.set(n, new Set());
        subjMap.get(n).add(l.subjectName);
    });

    for(let i = 0; i < desiredOrder.length; i++){
        const name = desiredOrder[i];
        const pos = i + 1; // subjectOrder deve ser 1-based
        const n = normalize(name);

        if(!subjMap.has(n)){
            console.log(`Aviso: assunto "${name}" não encontrado no DB (normalizado: "${n}").`);
            continue;
        }

        const originals = Array.from(subjMap.get(n));
        for(const orig of originals){
            const res = await prisma.videoLesson.updateMany({ where: { module: 3, subjectName: orig }, data: { subjectOrder: pos } });
            console.log(`Atualizados ${res.count} linhas para subjectName="${orig}" -> subjectOrder=${pos}`);
        }
    }

    console.log('Operação concluída.');
}

main().catch(e => {
    console.error('Erro:', e);
}).finally(() => prisma.$disconnect());
