-- CreateTable
CREATE TABLE `VideoLesson` (
    `id` VARCHAR(191) NOT NULL,
    `module` INTEGER NOT NULL,
    `subjectOrder` INTEGER NOT NULL,
    `subjectName` VARCHAR(191) NOT NULL,
    `lessonOrder` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `vimeoId` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `requiredModality` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoLesson_module_subjectOrder_idx`(`module`, `subjectOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PdfMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `module` INTEGER NOT NULL,
    `subjectOrder` INTEGER NOT NULL,
    `subjectName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `modality` VARCHAR(191) NULL,
    `filename` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PdfMaterial_module_subjectOrder_idx`(`module`, `subjectOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
