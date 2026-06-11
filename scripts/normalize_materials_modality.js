const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const normalizeModality = (raw) => {
  if (!raw && raw !== '') return 'default';
  const v = String(raw || '').toLowerCase().trim();
  if (v === '' || v === 'default' || v === 'geral' || v === 'g') return 'default';
  if (v.includes('extensivo')) return 'pe_extensivo';
  if (v.includes('aprofund')) return 'pe_aprofundamento';
  if (v.includes('cong') || v.includes('congru')) return 'cong_mod';
  if (v === 'extra2' || v.includes('extra2')) return 'extra2';
  if (v === 'extra' || v.includes('extra')) return 'extra';
  return v.replace(/\s+/g, '_');
};

async function run() {
  try {
    console.log('Buscando todos os PdfMaterial...');
    const all = await prisma.pdfMaterial.findMany();
    console.log(`Encontrados ${all.length} registros.`);

    const updates = [];
    for (const m of all) {
      const norm = normalizeModality(m.modality);
      if (norm !== (m.modality || '')) {
        console.log(`Atualizando ${m.id}: "${m.modality}" -> "${norm}"`);
        updates.push(prisma.pdfMaterial.update({ where: { id: m.id }, data: { modality: norm } }));
      }
    }

    if (updates.length === 0) {
      console.log('Nenhuma atualização necessária.');
    } else {
      await prisma.$transaction(updates);
      console.log(`Atualizadas ${updates.length} entradas.`);
    }
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
