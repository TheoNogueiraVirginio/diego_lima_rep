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
            where: { module: moduleIdInt }
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
                    titulo: name,
                    vimeoId: "", // Default empty
                    duracao: 0,
                    subAulas: [],
                    materiais: { teoria: {}, listas: {}, gabaritos: {} }
                };
            }
            return subjects[order];
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
            const subj = getSubject(m.subjectOrder, m.subjectName); // Should exist if lessons exist, but handle if pdf only
            
            // Map flat list to nested structure: materials[category][modality] = filename
            if (m.category === 'teoria') {
                if (m.modality) {
                     // If existing is string, convert to object? 
                     // The logic provided in dados_aulas was chaotic (string or object). We standardize to object if possible?
                     // Or just keep simple.
                     if (typeof subj.materiais.teoria === 'string') {
                         subj.materiais.teoria = { default: subj.materiais.teoria };
                     }
                     if (!subj.materiais.teoria || typeof subj.materiais.teoria !== 'object') {
                         subj.materiais.teoria = {};
                     }
                     subj.materiais.teoria[m.modality] = m.filename;
                } else {
                     // No modality
                     // If currently object, add to default?
                     if (typeof subj.materiais.teoria === 'object') {
                         subj.materiais.teoria['default'] = m.filename;
                     } else {
                         subj.materiais.teoria = m.filename;
                     }
                }
            } else if (['lista', 'gabarito'].includes(m.category)) {
                // Map category 'lista' -> 'listas', 'gabarito' -> 'gabaritos'
                const key = m.category === 'lista' ? 'listas' : 'gabaritos';
                if (!subj.materiais[key]) subj.materiais[key] = {};
                
                const modKey = m.modality || 'default';
                subj.materiais[key][modKey] = m.filename;
            }
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
        const { module, subjectOrder, subjectName, category, modality, filename, title } = req.body;
        
        await prisma.pdfMaterial.create({
            data: {
                module: parseInt(module),
                subjectOrder: parseInt(subjectOrder),
                subjectName,
                category,
                modality,
                filename,
                title
            }
        });
        
        res.status(201).json({ message: 'Success' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create PDF' });
    }
};
