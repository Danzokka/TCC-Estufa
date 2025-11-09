/*
  Warnings:

  - You are about to drop the column `currentLightIntensity` on the `Greenhouse` table. All the data in the column will be lost.
  - You are about to drop the column `currentWaterLevel` on the `Greenhouse` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `Greenhouse` table. All the data in the column will be lost.
  - You are about to drop the column `batteryLevel` on the `GreenhouseSensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `GreenhouseSensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `lightIntensity` on the `GreenhouseSensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `signalStrength` on the `GreenhouseSensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `waterLevel` on the `GreenhouseSensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `waterReserve` on the `GreenhouseSensorReading` table. All the data in the column will be lost.
  - You are about to drop the `BlogPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Like` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sensor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[activeUserPlantId]` on the table `Greenhouse` will be added. If there are existing duplicate values, this will fail.
  - Made the column `soilTemperature` on table `GreenhouseSensorReading` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."BlogPost" DROP CONSTRAINT "BlogPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_blogPostId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Device" DROP CONSTRAINT "Device_greenhouseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Like" DROP CONSTRAINT "Like_blogPostId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sensor" DROP CONSTRAINT "Sensor_userPlantId_fkey";

-- DropIndex
DROP INDEX "public"."Greenhouse_deviceId_idx";

-- DropIndex
DROP INDEX "public"."Greenhouse_deviceId_key";

-- DropIndex
DROP INDEX "public"."GreenhouseSensorReading_deviceId_idx";

-- AlterTable
ALTER TABLE "public"."Greenhouse" DROP COLUMN "currentLightIntensity",
DROP COLUMN "currentWaterLevel",
DROP COLUMN "deviceId",
ADD COLUMN     "activeUserPlantId" TEXT;

-- AlterTable
ALTER TABLE "public"."GreenhouseSensorReading" DROP COLUMN "batteryLevel",
DROP COLUMN "deviceId",
DROP COLUMN "lightIntensity",
DROP COLUMN "signalStrength",
DROP COLUMN "waterLevel",
DROP COLUMN "waterReserve",
ADD COLUMN     "plantHealthScore" DOUBLE PRECISION,
ALTER COLUMN "soilTemperature" SET NOT NULL;

-- DropTable
DROP TABLE "public"."BlogPost";

-- DropTable
DROP TABLE "public"."Comment";

-- DropTable
DROP TABLE "public"."Device";

-- DropTable
DROP TABLE "public"."Like";

-- DropTable
DROP TABLE "public"."Sensor";

-- CreateIndex
CREATE UNIQUE INDEX "Greenhouse_activeUserPlantId_key" ON "public"."Greenhouse"("activeUserPlantId");

-- CreateIndex
CREATE INDEX "Greenhouse_activeUserPlantId_idx" ON "public"."Greenhouse"("activeUserPlantId");

-- CreateIndex
CREATE INDEX "GreenhouseSensorReading_plantHealthScore_idx" ON "public"."GreenhouseSensorReading"("plantHealthScore");

-- AddForeignKey
ALTER TABLE "public"."Greenhouse" ADD CONSTRAINT "Greenhouse_activeUserPlantId_fkey" FOREIGN KEY ("activeUserPlantId") REFERENCES "public"."UserPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
