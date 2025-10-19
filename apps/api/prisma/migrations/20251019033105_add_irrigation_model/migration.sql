-- CreateTable
CREATE TABLE "public"."Irrigation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "waterAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "greenhouseId" TEXT NOT NULL,
    "userId" TEXT,
    "plantId" TEXT,
    "sensorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Irrigation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Irrigation_greenhouseId_idx" ON "public"."Irrigation"("greenhouseId");

-- CreateIndex
CREATE INDEX "Irrigation_type_idx" ON "public"."Irrigation"("type");

-- CreateIndex
CREATE INDEX "Irrigation_createdAt_idx" ON "public"."Irrigation"("createdAt");

-- CreateIndex
CREATE INDEX "Irrigation_userId_idx" ON "public"."Irrigation"("userId");

-- AddForeignKey
ALTER TABLE "public"."Irrigation" ADD CONSTRAINT "Irrigation_greenhouseId_fkey" FOREIGN KEY ("greenhouseId") REFERENCES "public"."Greenhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Irrigation" ADD CONSTRAINT "Irrigation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Irrigation" ADD CONSTRAINT "Irrigation_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Irrigation" ADD CONSTRAINT "Irrigation_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "public"."GreenhouseSensorReading"("id") ON DELETE SET NULL ON UPDATE CASCADE;
