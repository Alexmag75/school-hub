/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Subject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Subject` DROP COLUMN `teacherId`;

-- CreateTable
CREATE TABLE `TeacherSubjectClass` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TeacherSubjectClass_teacherId_subjectId_classId_key`(`teacherId`, `subjectId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TeacherSubjectClass` ADD CONSTRAINT `TeacherSubjectClass_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubjectClass` ADD CONSTRAINT `TeacherSubjectClass_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubjectClass` ADD CONSTRAINT `TeacherSubjectClass_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
