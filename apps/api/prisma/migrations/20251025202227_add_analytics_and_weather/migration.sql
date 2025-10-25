-- AlterTable
ALTER TABLE "public"."UserPlant" ADD COLUMN     "greenhouseId" TEXT;

-- CreateTable
CREATE TABLE "public"."WeatherData" (
    "id" TEXT NOT NULL,
    "greenhouseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "maxTemp" DOUBLE PRECISION NOT NULL,
    "minTemp" DOUBLE PRECISION NOT NULL,
    "avgTemp" DOUBLE PRECISION NOT NULL,
    "maxHumidity" DOUBLE PRECISION NOT NULL,
    "minHumidity" DOUBLE PRECISION NOT NULL,
    "avgHumidity" DOUBLE PRECISION NOT NULL,
    "totalPrecip" DOUBLE PRECISION NOT NULL,
    "avgWind" DOUBLE PRECISION,
    "maxWind" DOUBLE PRECISION,
    "condition" TEXT,
    "sunrise" TEXT,
    "sunset" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "userPlantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalReadings" INTEGER NOT NULL,
    "totalIrrigations" INTEGER NOT NULL,
    "avgGrowthRate" DOUBLE PRECISION,
    "summary" TEXT,
    "aiInsights" JSONB,
    "recommendations" JSONB,
    "weatherSummary" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherData_greenhouseId_idx" ON "public"."WeatherData"("greenhouseId");

-- CreateIndex
CREATE INDEX "WeatherData_date_idx" ON "public"."WeatherData"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherData_greenhouseId_date_key" ON "public"."WeatherData"("greenhouseId", "date");

-- CreateIndex
CREATE INDEX "Report_userPlantId_idx" ON "public"."Report"("userPlantId");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "public"."Report"("type");

-- CreateIndex
CREATE INDEX "Report_startDate_idx" ON "public"."Report"("startDate");

-- CreateIndex
CREATE INDEX "Report_endDate_idx" ON "public"."Report"("endDate");

-- AddForeignKey
ALTER TABLE "public"."UserPlant" ADD CONSTRAINT "UserPlant_greenhouseId_fkey" FOREIGN KEY ("greenhouseId") REFERENCES "public"."Greenhouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeatherData" ADD CONSTRAINT "WeatherData_greenhouseId_fkey" FOREIGN KEY ("greenhouseId") REFERENCES "public"."Greenhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "public"."UserPlant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
