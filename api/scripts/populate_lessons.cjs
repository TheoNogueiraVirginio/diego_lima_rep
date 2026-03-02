const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cursoData = require('./temp_dados_aulas.cjs');

async function main() {
    console.log('Starting migration...');

    try {
        for (const [modKey, modData] of Object.entries(cursoData)) {
            const moduleInt = parseInt(modKey);
            if (isNaN(moduleInt)) continue;

            let subjectOrder = 1;

            if (!modData.aulas) continue;

            for (const aula of modData.aulas) {
                const subjectName = aula.titulo;
                
                // Insert Main Video if vimeoId exists and is roughly valid
                if (aula.vimeoId && aula.vimeoId.length > 3) {
                    await prisma.videoLesson.create({
                        data: {
                            module: moduleInt,
                            subjectOrder: subjectOrder,
                            lessonOrder: 0, // Main lesson
                            subjectName: subjectName,
                            title: aula.titulo,
                            vimeoId: aula.vimeoId,
                            duration: aula.duracao || 0,
                            requiredModality: aula.requiredModality || null
                        }
                    });
                    console.log(`Created Video: [${moduleInt}.${subjectOrder}.0] ${subjectName} (Main)`);
                }

                // Insert Sub-Lessons
                if (aula.subAulas && Array.isArray(aula.subAulas)) {
                    let lessonOrder = 1;
                    for (const sub of aula.subAulas) {
                        if (sub.vimeoId && sub.vimeoId.length > 3) {
                             await prisma.videoLesson.create({
                                data: {
                                    module: moduleInt,
                                    subjectOrder: subjectOrder,
                                    lessonOrder: lessonOrder,
                                    subjectName: subjectName,
                                    title: sub.titulo,
                                    vimeoId: sub.vimeoId,
                                    duration: sub.duracao || 0,
                                    requiredModality: sub.requiredModality || null
                                }
                            });
                            console.log(`Created Video: [${moduleInt}.${subjectOrder}.${lessonOrder}] ${sub.titulo}`);
                        }
                        lessonOrder++;
                    }
                }

                // Insert Materials (PDFs)
                if (aula.materiais) {
                    const mats = aula.materiais;
                    
                    // Teoria
                    if (mats.teoria) {
                        if (typeof mats.teoria === 'string' && mats.teoria.length > 0) {
                            await prisma.pdfMaterial.create({
                                data: {
                                    module: moduleInt,
                                    subjectOrder: subjectOrder,
                                    subjectName: subjectName,
                                    category: 'teoria',
                                    filename: mats.teoria,
                                    title: 'Teoria'
                                }
                            });
                        } else if (typeof mats.teoria === 'object') {
                            for (const [key, val] of Object.entries(mats.teoria)) {
                                if (val) {
                                    await prisma.pdfMaterial.create({
                                        data: {
                                            module: moduleInt,
                                            subjectOrder: subjectOrder,
                                            subjectName: subjectName,
                                            category: 'teoria',
                                            modality: key,
                                            filename: val,
                                            title: `Teoria (${key})`
                                        }
                                    });
                                }
                            }
                        }
                    }

                    // Listas
                    if (mats.listas) {
                        for (const [key, val] of Object.entries(mats.listas)) {
                             if (val) {
                                await prisma.pdfMaterial.create({
                                    data: {
                                        module: moduleInt,
                                        subjectOrder: subjectOrder,
                                        subjectName: subjectName,
                                        category: 'lista',
                                        modality: key,
                                        filename: val,
                                        title: `Lista (${key})`
                                    }
                                });
                            }
                        }
                    }

                    // Gabaritos
                    if (mats.gabaritos) {
                        for (const [key, val] of Object.entries(mats.gabaritos)) {
                            if (val) {
                                await prisma.pdfMaterial.create({
                                    data: {
                                        module: moduleInt,
                                        subjectOrder: subjectOrder,
                                        subjectName: subjectName,
                                        category: 'gabarito',
                                        modality: key,
                                        filename: val,
                                        title: `Gabarito (${key})`
                                    }
                                });
                            }
                        }
                    }
                }

                subjectOrder++;
            }
        }
        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
