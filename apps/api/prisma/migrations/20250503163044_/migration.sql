/*
  Warnings:

  - You are about to drop the `PlantIdealValues` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Plant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `air_humidity_final` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `air_humidity_initial` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `air_temperature_final` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `air_temperature_initial` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `light_intensity_final` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `light_intensity_initial` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `soil_moisture_final` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `soil_moisture_initial` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `soil_temperature_final` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `soil_temperature_initial` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userPlantId` to the `Sensor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PlantIdealValues" DROP CONSTRAINT "PlantIdealValues_plant_id_plant_name_fkey";

-- DropIndex
DROP INDEX "Plant_id_name_key";

-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "air_humidity_final" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "air_humidity_initial" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "air_temperature_final" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "air_temperature_initial" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "light_intensity_final" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "light_intensity_initial" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "soil_moisture_final" INTEGER NOT NULL,
ADD COLUMN     "soil_moisture_initial" INTEGER NOT NULL,
ADD COLUMN     "soil_temperature_final" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "soil_temperature_initial" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "userPlantId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "PlantIdealValues";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "datecreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateupdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlant" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" INTEGER NOT NULL,
    "nickname" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPlant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlant_userId_plantId_key" ON "UserPlant"("userId", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "Comment_blogPostId_idx" ON "Comment"("blogPostId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Like_blogPostId_idx" ON "Like"("blogPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_blogPostId_key" ON "Like"("userId", "blogPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_name_key" ON "Plant"("name");

-- AddForeignKey
ALTER TABLE "UserPlant" ADD CONSTRAINT "UserPlant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlant" ADD CONSTRAINT "UserPlant_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "UserPlant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
