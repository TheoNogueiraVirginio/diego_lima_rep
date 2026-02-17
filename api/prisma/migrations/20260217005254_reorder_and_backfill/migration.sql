-- Move studentName after id
ALTER TABLE LessonProgress MODIFY COLUMN studentName VARCHAR(191) AFTER id;

-- Backfill data
UPDATE LessonProgress lp
JOIN Enrollment e ON lp.enrollmentId = e.id
SET lp.studentName = e.name
WHERE lp.studentName IS NULL;