/*
  Warnings:

  - The primary key for the `Plant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Sensor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserPlant` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Sensor" DROP CONSTRAINT "Sensor_userPlantId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlant" DROP CONSTRAINT "UserPlant_plantId_fkey";

-- AlterTable
ALTER TABLE "Plant" DROP CONSTRAINT "Plant_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Plant_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Plant_id_seq";

-- AlterTable
ALTER TABLE "Sensor" DROP CONSTRAINT "Sensor_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userPlantId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Sensor_id_seq";

-- AlterTable
ALTER TABLE "UserPlant" DROP CONSTRAINT "UserPlant_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "plantId" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserPlant_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserPlant_id_seq";

-- AddForeignKey
ALTER TABLE "UserPlant" ADD CONSTRAINT "UserPlant_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "UserPlant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
