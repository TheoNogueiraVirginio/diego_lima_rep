-- AlterTable
ALTER TABLE `PdfMaterial`
    ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0;

SET @grp := '';
SET @row := 0;

UPDATE `PdfMaterial` pm
JOIN (
    SELECT orderedRows.id, orderedRows.displayOrder
    FROM (
        SELECT
            id,
            @row := IF(@grp = CONCAT(module, '|', subjectOrder, '|', category, '|', IFNULL(modality, 'default')), @row + 1, 1) AS displayOrder,
            @grp := CONCAT(module, '|', subjectOrder, '|', category, '|', IFNULL(modality, 'default')) AS grp
        FROM `PdfMaterial`
        CROSS JOIN (SELECT @grp := '', @row := 0) vars
        ORDER BY module, subjectOrder, category, modality, createdAt, id
    ) orderedRows
) seq ON seq.id = pm.id
SET pm.displayOrder = seq.displayOrder;
