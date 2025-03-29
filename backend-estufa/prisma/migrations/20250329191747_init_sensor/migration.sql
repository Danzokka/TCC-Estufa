/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Post";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Sensor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "air_temperature" REAL NOT NULL,
    "air_humidity" REAL NOT NULL,
    "soil_moisture" TEXT NOT NULL,
    "soil_temperature" REAL NOT NULL,
    "light_intensity" REAL NOT NULL,
    "water_level" REAL NOT NULL,
    "water_reserve" REAL NOT NULL,
    "timecreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
