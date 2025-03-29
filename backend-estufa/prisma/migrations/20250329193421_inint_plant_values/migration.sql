/*
  Warnings:

  - You are about to alter the column `soil_moisture` on the `Sensor` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- CreateTable
CREATE TABLE "Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateadded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlantIdealValues" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plant_id" INTEGER NOT NULL,
    "plant_name" TEXT NOT NULL,
    "air_temperature_initial" REAL NOT NULL,
    "air_humidity_initial" REAL NOT NULL,
    "soil_moisture_initial" INTEGER NOT NULL,
    "soil_temperature_initial" REAL NOT NULL,
    "light_intensity_initial" REAL NOT NULL,
    "air_temperature_final" REAL NOT NULL,
    "air_humidity_final" REAL NOT NULL,
    "soil_moisture_final" INTEGER NOT NULL,
    "soil_temperature_final" REAL NOT NULL,
    "light_intensity_final" REAL NOT NULL,
    CONSTRAINT "PlantIdealValues_plant_id_plant_name_fkey" FOREIGN KEY ("plant_id", "plant_name") REFERENCES "Plant" ("id", "name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sensor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plant_id" INTEGER NOT NULL DEFAULT 0,
    "air_temperature" REAL NOT NULL,
    "air_humidity" REAL NOT NULL,
    "soil_moisture" INTEGER NOT NULL,
    "soil_temperature" REAL NOT NULL,
    "light_intensity" REAL NOT NULL,
    "water_level" REAL NOT NULL,
    "water_reserve" REAL NOT NULL,
    "timecreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sensor_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sensor" ("air_humidity", "air_temperature", "id", "light_intensity", "soil_moisture", "soil_temperature", "timecreated", "water_level", "water_reserve") SELECT "air_humidity", "air_temperature", "id", "light_intensity", "soil_moisture", "soil_temperature", "timecreated", "water_level", "water_reserve" FROM "Sensor";
DROP TABLE "Sensor";
ALTER TABLE "new_Sensor" RENAME TO "Sensor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Plant_id_name_key" ON "Plant"("id", "name");
