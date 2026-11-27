-- AlterTable
ALTER TABLE `PdfMaterial`
    ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0;

UPDATE `PdfMaterial` pm
JOIN (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY
                module,
                subjectOrder,
                category,
                COALESCE(modality, _utf8mb4'default' COLLATE utf8mb4_unicode_ci)
            ORDER BY module, subjectOrder, category, modality, createdAt, id
        ) AS displayOrder
    FROM `PdfMaterial`
) seq ON seq.id = pm.id
SET pm.displayOrder = seq.displayOrder;
