-- CreateTable
CREATE TABLE "Plant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateadded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantIdealValues" (
    "id" SERIAL NOT NULL,
    "plant_id" INTEGER NOT NULL,
    "plant_name" TEXT NOT NULL,
    "air_temperature_initial" DOUBLE PRECISION NOT NULL,
    "air_humidity_initial" DOUBLE PRECISION NOT NULL,
    "soil_moisture_initial" INTEGER NOT NULL,
    "soil_temperature_initial" DOUBLE PRECISION NOT NULL,
    "light_intensity_initial" DOUBLE PRECISION NOT NULL,
    "air_temperature_final" DOUBLE PRECISION NOT NULL,
    "air_humidity_final" DOUBLE PRECISION NOT NULL,
    "soil_moisture_final" INTEGER NOT NULL,
    "soil_temperature_final" DOUBLE PRECISION NOT NULL,
    "light_intensity_final" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlantIdealValues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "air_temperature" DOUBLE PRECISION NOT NULL,
    "air_humidity" DOUBLE PRECISION NOT NULL,
    "soil_moisture" INTEGER NOT NULL,
    "soil_temperature" DOUBLE PRECISION NOT NULL,
    "light_intensity" DOUBLE PRECISION NOT NULL,
    "water_level" DOUBLE PRECISION NOT NULL,
    "water_reserve" DOUBLE PRECISION NOT NULL,
    "timecreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plant_id_name_key" ON "Plant"("id", "name");

-- AddForeignKey
ALTER TABLE "PlantIdealValues" ADD CONSTRAINT "PlantIdealValues_plant_id_plant_name_fkey" FOREIGN KEY ("plant_id", "plant_name") REFERENCES "Plant"("id", "name") ON DELETE RESTRICT ON UPDATE CASCADE;
