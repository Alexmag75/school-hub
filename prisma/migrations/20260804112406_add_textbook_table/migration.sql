-- CreateTable
CREATE TABLE `Textbook` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `author` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `coverUrl` VARCHAR(191) NULL,
    `category` ENUM('TEXTBOOK', 'PROBLEM_BOOK', 'DICTIONARY', 'OLYMPIAD', 'PUZZLE', 'OTHER') NOT NULL DEFAULT 'TEXTBOOK',
    `subjectId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Textbook_subjectId_idx`(`subjectId`),
    INDEX `Textbook_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Textbook` ADD CONSTRAINT `Textbook_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Textbook` ADD CONSTRAINT `Textbook_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
