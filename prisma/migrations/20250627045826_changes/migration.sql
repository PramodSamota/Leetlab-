/*
  Warnings:

  - You are about to drop the column `title` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "title",
ADD COLUMN     "time" TEXT;
