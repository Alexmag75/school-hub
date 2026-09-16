-- AlterTable
ALTER TABLE `Textbook` ADD COLUMN `classId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `_TextbookClasses` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_TextbookClasses_AB_unique`(`A`, `B`),
    INDEX `_TextbookClasses_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_TextbookClasses` ADD CONSTRAINT `_TextbookClasses_A_fkey` FOREIGN KEY (`A`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TextbookClasses` ADD CONSTRAINT `_TextbookClasses_B_fkey` FOREIGN KEY (`B`) REFERENCES `Textbook`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
