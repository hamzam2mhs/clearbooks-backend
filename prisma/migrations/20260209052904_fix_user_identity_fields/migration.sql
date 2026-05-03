/*
  Warnings:

  - You are about to drop the column `congnitoSub` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cognitoSub]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cognitoSub` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_congnitoSub_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "congnitoSub",
ADD COLUMN     "cognitoSub" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_cognitoSub_key" ON "User"("cognitoSub");
