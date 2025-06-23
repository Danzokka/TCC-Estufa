-- CreateTable
CREATE TABLE "Greenhouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "ownerId" TEXT NOT NULL,
    "currentTemperature" DOUBLE PRECISION,
    "currentHumidity" DOUBLE PRECISION,
    "currentSoilMoisture" INTEGER,
    "currentLightIntensity" DOUBLE PRECISION,
    "currentWaterLevel" DOUBLE PRECISION,
    "targetTemperature" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "targetHumidity" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "targetSoilMoisture" INTEGER NOT NULL DEFAULT 50,
    "minWaterLevel" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "deviceId" TEXT,
    "wifiSSID" TEXT,
    "wifiPassword" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastDataUpdate" TIMESTAMP(3),
    "qrCodeData" TEXT,
    "qrCodeGeneratedAt" TIMESTAMP(3),
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Greenhouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreenhouseSensorReading" (
    "id" TEXT NOT NULL,
    "greenhouseId" TEXT NOT NULL,
    "airTemperature" DOUBLE PRECISION NOT NULL,
    "airHumidity" DOUBLE PRECISION NOT NULL,
    "soilMoisture" INTEGER NOT NULL,
    "soilTemperature" DOUBLE PRECISION,
    "lightIntensity" DOUBLE PRECISION NOT NULL,
    "waterLevel" DOUBLE PRECISION NOT NULL,
    "waterReserve" DOUBLE PRECISION,
    "deviceId" TEXT,
    "batteryLevel" DOUBLE PRECISION,
    "signalStrength" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "GreenhouseSensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Greenhouse_deviceId_key" ON "Greenhouse"("deviceId");

-- CreateIndex
CREATE INDEX "Greenhouse_ownerId_idx" ON "Greenhouse"("ownerId");

-- CreateIndex
CREATE INDEX "Greenhouse_deviceId_idx" ON "Greenhouse"("deviceId");

-- CreateIndex
CREATE INDEX "Greenhouse_isOnline_idx" ON "Greenhouse"("isOnline");

-- CreateIndex
CREATE INDEX "Greenhouse_lastDataUpdate_idx" ON "Greenhouse"("lastDataUpdate");

-- CreateIndex
CREATE INDEX "GreenhouseSensorReading_greenhouseId_idx" ON "GreenhouseSensorReading"("greenhouseId");

-- CreateIndex
CREATE INDEX "GreenhouseSensorReading_timestamp_idx" ON "GreenhouseSensorReading"("timestamp");

-- CreateIndex
CREATE INDEX "GreenhouseSensorReading_deviceId_idx" ON "GreenhouseSensorReading"("deviceId");

-- AddForeignKey
ALTER TABLE "PumpOperation" ADD CONSTRAINT "PumpOperation_greenhouseId_fkey" FOREIGN KEY ("greenhouseId") REFERENCES "Greenhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_greenhouseId_fkey" FOREIGN KEY ("greenhouseId") REFERENCES "Greenhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Greenhouse" ADD CONSTRAINT "Greenhouse_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenhouseSensorReading" ADD CONSTRAINT "GreenhouseSensorReading_greenhouseId_fkey" FOREIGN KEY ("greenhouseId") REFERENCES "Greenhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
