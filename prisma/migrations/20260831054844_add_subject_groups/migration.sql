/*
  Warnings:

  - You are about to drop the column `date` on the `JournalColumn` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `JournalColumn` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(4))`.
  - A unique constraint covering the columns `[columnId,studentId]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teacherId,subjectId,classId,subgroupId]` on the table `TeacherSubjectClass` will be added. If there are existing duplicate values, this will fail.
  - Made the column `title` on table `JournalColumn` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Grade` DROP FOREIGN KEY `Grade_teacherId_fkey`;

-- DropIndex
DROP INDEX `Grade_studentId_subjectId_idx` ON `Grade`;

-- DropIndex
DROP INDEX `JournalColumn_classId_subjectId_idx` ON `JournalColumn`;

-- DropIndex
DROP INDEX `TeacherSubjectClass_teacherId_subjectId_classId_key` ON `TeacherSubjectClass`;

-- AlterTable
ALTER TABLE `Grade` ADD COLUMN `status` ENUM('PENDING', 'COMPLETED', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    MODIFY `value` INTEGER NULL,
    MODIFY `comment` TEXT NULL,
    MODIFY `teacherId` VARCHAR(191) NULL,
    MODIFY `subjectId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `JournalColumn` DROP COLUMN `date`,
    ADD COLUMN `deadline` DATETIME(3) NULL,
    ADD COLUMN `materialId` VARCHAR(191) NULL,
    MODIFY `title` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('LESSON', 'TEST', 'ASSIGNMENT') NOT NULL;

-- AlterTable
ALTER TABLE `Subject` ADD COLUMN `groupsCount` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `hasGroups` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `TeacherSubjectClass` ADD COLUMN `subgroupId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TeacherAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TeacherAssignment_teacherId_subjectId_classId_key`(`teacherId`, `subjectId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyTask` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyTaskComment` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `isWinner` BOOLEAN NOT NULL DEFAULT false,
    `isBestAnswer` BOOLEAN NOT NULL DEFAULT false,
    `teacherNote` TEXT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherNews` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemLog` (
    `id` VARCHAR(191) NOT NULL,
    `level` ENUM('INFO', 'WARN', 'ERROR') NOT NULL DEFAULT 'ERROR',
    `message` VARCHAR(191) NOT NULL,
    `stack` TEXT NULL,
    `source` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `userEmail` VARCHAR(191) NULL,
    `userRole` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemLog_createdAt_idx`(`createdAt`),
    INDEX `SystemLog_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubjectGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_StudentSubgroups` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_StudentSubgroups_AB_unique`(`A`, `B`),
    INDEX `_StudentSubgroups_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Grade_columnId_studentId_key` ON `Grade`(`columnId`, `studentId`);

-- CreateIndex
CREATE UNIQUE INDEX `TeacherSubjectClass_teacherId_subjectId_classId_subgroupId_key` ON `TeacherSubjectClass`(`teacherId`, `subjectId`, `classId`, `subgroupId`);

-- AddForeignKey
ALTER TABLE `TeacherSubjectClass` ADD CONSTRAINT `TeacherSubjectClass_subgroupId_fkey` FOREIGN KEY (`subgroupId`) REFERENCES `SubjectGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalColumn` ADD CONSTRAINT `JournalColumn_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grade` ADD CONSTRAINT `Grade_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherAssignment` ADD CONSTRAINT `TeacherAssignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherAssignment` ADD CONSTRAINT `TeacherAssignment_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherAssignment` ADD CONSTRAINT `TeacherAssignment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTask` ADD CONSTRAINT `DailyTask_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTask` ADD CONSTRAINT `DailyTask_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTaskComment` ADD CONSTRAINT `DailyTaskComment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `DailyTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTaskComment` ADD CONSTRAINT `DailyTaskComment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherNews` ADD CONSTRAINT `TeacherNews_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubjectGroup` ADD CONSTRAINT `SubjectGroup_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_StudentSubgroups` ADD CONSTRAINT `_StudentSubgroups_A_fkey` FOREIGN KEY (`A`) REFERENCES `SubjectGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_StudentSubgroups` ADD CONSTRAINT `_StudentSubgroups_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
