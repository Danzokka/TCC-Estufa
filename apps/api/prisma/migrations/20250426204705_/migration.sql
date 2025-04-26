/*
  Warnings:

  - You are about to drop the column `plant_id` on the `Sensor` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sensor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "air_temperature" REAL NOT NULL,
    "air_humidity" REAL NOT NULL,
    "soil_moisture" INTEGER NOT NULL,
    "soil_temperature" REAL NOT NULL,
    "light_intensity" REAL NOT NULL,
    "water_level" REAL NOT NULL,
    "water_reserve" REAL NOT NULL,
    "timecreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Sensor" ("air_humidity", "air_temperature", "id", "light_intensity", "soil_moisture", "soil_temperature", "timecreated", "water_level", "water_reserve") SELECT "air_humidity", "air_temperature", "id", "light_intensity", "soil_moisture", "soil_temperature", "timecreated", "water_level", "water_reserve" FROM "Sensor";
DROP TABLE "Sensor";
ALTER TABLE "new_Sensor" RENAME TO "Sensor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
