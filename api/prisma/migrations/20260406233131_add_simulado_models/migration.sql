-- CreateTable
CREATE TABLE `SimuladoSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `simuladoId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `timeLimit` INTEGER NOT NULL,
    `timeSpent` INTEGER NULL,
    `totalScore` DOUBLE NOT NULL,
    `maxScore` DOUBLE NOT NULL DEFAULT 20.0,
    `percentage` DOUBLE NULL,

    INDEX `SimuladoSubmission_enrollmentId_idx`(`enrollmentId`),
    INDEX `SimuladoSubmission_simuladoId_idx`(`simuladoId`),
    UNIQUE INDEX `SimuladoSubmission_enrollmentId_simuladoId_key`(`enrollmentId`, `simuladoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SimuladoResponse` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `questionIndex` INTEGER NOT NULL,
    `selectedOption` VARCHAR(191) NULL,
    `flagged` BOOLEAN NOT NULL DEFAULT false,
    `isCorrect` BOOLEAN NULL,

    INDEX `SimuladoResponse_submissionId_idx`(`submissionId`),
    UNIQUE INDEX `SimuladoResponse_submissionId_questionIndex_key`(`submissionId`, `questionIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SimuladoSubmission` ADD CONSTRAINT `SimuladoSubmission_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SimuladoResponse` ADD CONSTRAINT `SimuladoResponse_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `SimuladoSubmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
