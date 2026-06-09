import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
        const materials = await prisma.pdfMaterial.findMany({
            where: { module: moduleIdInt },
            orderBy: [
                { subjectOrder: 'asc' },
                { category: 'asc' },
                { modality: 'asc' },
                { displayOrder: 'asc' },
                { createdAt: 'asc' }
            ]
        });

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
                    const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : Number.MAX_SAFE_INTEGER;
                    const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : Number.MAX_SAFE_INTEGER;
                    if (orderA !== orderB) return orderA - orderB;

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

            const modKey = m.modality || 'default';
            if (!Array.isArray(subj.materiais[bucketKey][modKey])) subj.materiais[bucketKey][modKey] = [];
            subj.materiais[bucketKey][modKey].push({
                id: m.id,
                filename: m.filename,
                title: m.title,
                displayOrder: m.displayOrder
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
            modality: modality || 'default'
        };

        let nextDisplayOrder = null;
        if (Number.isInteger(Number(displayOrder))) {
            nextDisplayOrder = parseInt(displayOrder);
        } else {
            const agg = await prisma.pdfMaterial.aggregate({
                where: scope,
                _max: { displayOrder: true }
            });
            nextDisplayOrder = (agg._max.displayOrder ?? 0) + 1;
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

        await prisma.$transaction(updates);
        res.json({ success: true });
    } catch (e) {
        console.error('Error reordering pdfs:', e);
        res.status(500).json({ error: e.message });
    }
};
