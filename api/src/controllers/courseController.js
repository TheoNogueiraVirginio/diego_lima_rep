import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Normaliza valores de `modality` vindos do banco para as chaves esperadas
const normalizeModality = (raw) => {
    if (!raw && raw !== '') return 'default';
    const v = String(raw || '').toLowerCase().trim();
    if (v === '' || v === 'default' || v === 'geral' || v === 'g') return 'default';
    if (v.includes('extensivo')) return 'pe_extensivo';
    if (v.includes('aprofund')) return 'pe_aprofundamento';
    if (v.includes('cong') || v.includes('congru')) return 'cong_mod';
    if (v === 'extra2' || v.includes('extra2')) return 'extra2';
    if (v === 'extra' || v.includes('extra')) return 'extra';
    // fallback: transformar espaços em underline e usar como chave
    return v.replace(/\s+/g, '_');
};

export const getLessonsByModule = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const moduleIdInt = parseInt(moduleId);

        if (isNaN(moduleIdInt)) {
             return res.status(400).json({ error: 'Invalid module ID' });
        }

        const lessons = await prisma.videoLesson.findMany({
            where: { module: moduleIdInt },
            orderBy: [
                { subjectOrder: 'asc' },
                { lessonOrder: 'asc' }
            ]
        });

        // Fetch materials for these subjects too
        // Try to fetch materials normally. If the DB hasn't run the migration
        // to add `displayOrder`, Prisma may throw P2022 because the client
        // expects that column. In that case retry with an explicit select
        // that does not include `displayOrder`.
        let materials;
        try {
            materials = await prisma.pdfMaterial.findMany({
                where: { module: moduleIdInt },
                orderBy: [
                    { subjectOrder: 'asc' },
                    { category: 'asc' },
                    { modality: 'asc' },
                    { createdAt: 'asc' }
                ]
            });
        } catch (err) {
            // If missing column error from Prisma, refetch selecting known columns
            if (err && err.code === 'P2022') {
                materials = await prisma.pdfMaterial.findMany({
                    where: { module: moduleIdInt },
                    orderBy: [
                        { subjectOrder: 'asc' },
                        { category: 'asc' },
                        { modality: 'asc' },
                        { createdAt: 'asc' }
                    ],
                    select: {
                        id: true,
                        module: true,
                        subjectOrder: true,
                        subjectName: true,
                        category: true,
                        modality: true,
                        filename: true,
                        title: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
            } else {
                throw err;
            }
        }

        // Reshape to match frontend expectation (optional, or change frontend)
        // Frontend expects: { subject: { vimeoId, subAulas: [], materiais: {} } }
        // We can mimic the structure of `dados_aulas.js` to minimize frontend rewrite.

        // Group by Subject (subjectOrder)
        const subjects = {};

        // Helper to get or create subject entry
        const getSubject = (order, name) => {
            if (!subjects[order]) {
                subjects[order] = {
                    subjectOrder: parseInt(order),
                    titulo: name,
                    vimeoId: "", // Default empty
                    duracao: 0,
                    subAulas: [],
                    materiais: { teoria: {}, listas: {}, gabaritos: {} }
                };
            }
            return subjects[order];
        };

        const getMaterialBucketKey = (category) => {
            if (category === 'teoria') return 'teoria';
            if (category === 'lista') return 'listas';
            if (category === 'gabarito') return 'gabaritos';
            return null;
        };

        const sortPdfEntries = (bucket) => {
            Object.keys(bucket).forEach(modKey => {
                if (!Array.isArray(bucket[modKey])) return;

                bucket[modKey].sort((a, b) => {
                    const hasA = Number.isFinite(a.displayOrder);
                    const hasB = Number.isFinite(b.displayOrder);

                    if (hasA && hasB) {
                        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
                    } else if (hasA && !hasB) {
                        return -1; // A comes before B
                    } else if (!hasA && hasB) {
                        return 1; // B comes before A
                    }

                    // Fallback: prefer older createdAt first
                    if (a.createdAt && b.createdAt) {
                        const ta = new Date(a.createdAt).getTime();
                        const tb = new Date(b.createdAt).getTime();
                        if (ta !== tb) return ta - tb;
                    }

                    const titleA = String(a.title || a.filename || '');
                    const titleB = String(b.title || b.filename || '');
                    return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
                });
            });
        };

        // Process Lessons
        lessons.forEach(l => {
            const subj = getSubject(l.subjectOrder, l.subjectName);
            
            if (l.lessonOrder === 0) {
                // Main lesson
                subj.id = `${l.module}.${l.subjectOrder}`; 
                subj.dbId = l.id;
                subj.vimeoId = l.vimeoId || "";
                subj.duracao = l.duration || 0;
            } else {
                // Sub lesson
                const compositeId = `${l.module}.${l.subjectOrder}.${l.lessonOrder}`;
                subj.subAulas.push({
                    id: compositeId, 
                    dbId: l.id,
                    titulo: l.title,
                    vimeoId: l.vimeoId || "",
                    duracao: l.duration || 0,
                    requiredModality: l.requiredModality,
                    lessonOrder: l.lessonOrder
                });
            }
        });

        // Process Materials
        materials.forEach(m => {
            const subj = getSubject(m.subjectOrder, m.subjectName);
            
            // Map flat list to nested structure: materials[category][modality] = { id, filename, title }
            // Map flat list to nested structure: materials[category][modality] = [ { id, filename, title }, ... ]
            const bucketKey = getMaterialBucketKey(m.category);
            if (!bucketKey) return;

            if (!subj.materiais[bucketKey] || typeof subj.materiais[bucketKey] !== 'object') {
                subj.materiais[bucketKey] = {};
            }

            const modKey = normalizeModality(m.modality);
            if (!Array.isArray(subj.materiais[bucketKey][modKey])) subj.materiais[bucketKey][modKey] = [];
            subj.materiais[bucketKey][modKey].push({
                id: m.id,
                filename: m.filename,
                title: m.title,
                displayOrder: m.displayOrder,
                createdAt: m.createdAt
            });
        });

        Object.values(subjects).forEach(subj => {
            sortPdfEntries(subj.materiais.teoria || {});
            sortPdfEntries(subj.materiais.listas || {});
            sortPdfEntries(subj.materiais.gabaritos || {});
        });

        
        const aulasArray = Object.keys(subjects).sort((a,b) => parseInt(a)-parseInt(b)).map(k => {
            const s = subjects[k];
            // If vimeoId is empty, add hideMainInSidebar
            if (!s.vimeoId || s.vimeoId.trim() === '') {
                s.hideMainInSidebar = true;
            }
            return s;
        });

        res.json({
            tituloModulo: `Módulo ${moduleId}`,
            aulas: aulasArray
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching lessons' });
    }
};

export const reorderLessons = async (req, res) => {
    try {
        const { videos } = req.body;
        if (!Array.isArray(videos)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const updates = videos.map(v => 
            prisma.videoLesson.update({
                where: { id: v.id },
                data: { lessonOrder: v.lessonOrder }
            })
        );
        
        await prisma.$transaction(updates);
        res.json({ success: true });
    } catch (e) {
        console.error('Error reordering lessons:', e);
        res.status(500).json({ error: e.message });
    }
};

export const updateLesson = async (req, res) => {
    // Admin Only
    try {
        const { id } = req.params;
        const { vimeoId, title, duration, requiredModality } = req.body;
        
        const updated = await prisma.videoLesson.update({
            where: { id },
            data: { vimeoId, title, duration, requiredModality }
        });
        
        res.json(updated);
    } catch (e) {
        res.status(500).json({error: e.message});
    }
};

export const createLesson = async (req, res) => {
    try {
       const data = req.body; // module, subjectOrder, lessonOrder, title, vimeoId...
       const created = await prisma.videoLesson.create({ data });
       res.status(201).json(created);
    }  catch (e) {
        res.status(500).json({error: e.message});
    }
};

// ... similar for Delete
export const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Missing lesson id' });

        // Attempt to delete the lesson by its primary id
        await prisma.videoLesson.delete({ where: { id } });
        return res.json({ success: true });
    } catch (e) {
        console.error('Error deleting lesson:', e);
        return res.status(500).json({ error: 'Failed to delete lesson' });
    }
};

export const createPdf = async (req, res) => {
    try {
        const { module, subjectOrder, subjectName, category, modality, filename, title, displayOrder } = req.body;
        
        if (!module || !subjectOrder || !category || !filename) {
            return res.status(400).json({ error: 'Missing required fields (module, subjectOrder, category, filename)' });
        }

        if (!['teoria', 'lista', 'gabarito'].includes(category)) {
             return res.status(400).json({ error: 'Invalid category. Must be one of: teoria, lista, gabarito' });
        }

        const scope = {
            module: parseInt(module),
            subjectOrder: parseInt(subjectOrder),
            category,
            modality: normalizeModality(modality)
        };

        let nextDisplayOrder = null;
        if (Number.isInteger(Number(displayOrder))) {
            nextDisplayOrder = parseInt(displayOrder);
        } else {
            try {
                const agg = await prisma.pdfMaterial.aggregate({
                    where: scope,
                    _max: { displayOrder: true }
                });
                nextDisplayOrder = (agg._max.displayOrder ?? 0) + 1;
            } catch (err) {
                // If displayOrder does not exist in the DB (P2022), fallback to count+1
                if (err && err.code === 'P2022') {
                    const cnt = await prisma.pdfMaterial.count({ where: scope });
                    nextDisplayOrder = cnt + 1;
                } else {
                    throw err;
                }
            }
        }

        const data = {
            module: scope.module,
            subjectOrder: scope.subjectOrder,
            subjectName,
            category,
            modality: scope.modality,
            displayOrder: nextDisplayOrder,
            filename,
            title
        };

        // Allow multiple PDFs per category and modality
        const result = await prisma.pdfMaterial.create({
            data
        });
        
        res.status(201).json(result);
    } catch (e) {
        console.error('Error creating PDF:', e);
        res.status(500).json({ error: 'Failed to save PDF' });
    }
};

export const deletePdf = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.pdfMaterial.delete({
            where: { id }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete PDF' });
    }
};

export const updatePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, title } = req.body;
        
        const updated = await prisma.pdfMaterial.update({
            where: { id },
            data: { filename, title }
        });
        res.json(updated);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update PDF' });
    }
};

export const reorderPdfs = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const updates = items.map(item => {
            if (!item?.id || !Number.isFinite(Number(item.displayOrder))) {
                throw new Error('Invalid item in payload');
            }

            return prisma.pdfMaterial.update({
                where: { id: item.id },
                data: { displayOrder: parseInt(item.displayOrder) }
            });
        });

        try {
            await prisma.$transaction(updates);
            res.json({ success: true });
        } catch (err) {
            // If DB hasn't applied migration and column is missing, return clear message
            if (err && err.code === 'P2022') {
                return res.status(500).json({ error: 'A coluna `displayOrder` não existe no banco. Execute a migração para adicionar essa coluna antes de usar a reordenação.' });
            }
            throw err;
        }
    } catch (e) {
        console.error('Error reordering pdfs:', e);
        res.status(500).json({ error: e.message });
    }
};
