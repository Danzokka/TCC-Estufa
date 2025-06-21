-- CreateTable
CREATE TABLE "PumpOperation" (
    "id" TEXT NOT NULL,
    "greenhouseId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "waterAmount" DOUBLE PRECISION,
    "reason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "errorMessage" TEXT,
    "esp32Response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PumpOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "greenhouseId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'esp32',
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "firmwareVersion" TEXT,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PumpOperation_greenhouseId_idx" ON "PumpOperation"("greenhouseId");

-- CreateIndex
CREATE INDEX "PumpOperation_status_idx" ON "PumpOperation"("status");

-- CreateIndex
CREATE INDEX "PumpOperation_startedAt_idx" ON "PumpOperation"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_macAddress_key" ON "Device"("macAddress");

-- CreateIndex
CREATE INDEX "Device_greenhouseId_idx" ON "Device"("greenhouseId");

-- CreateIndex
CREATE INDEX "Device_type_idx" ON "Device"("type");

-- CreateIndex
CREATE INDEX "Device_isOnline_idx" ON "Device"("isOnline");
