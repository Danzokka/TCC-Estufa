/**
 * Script to setup an active plant on the greenhouse
 * This is needed for the AI service to auto-detect irrigation config
 *
 * Run: npx ts-node scripts/setup-active-plant.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking greenhouses and plants...\n');

  // Get all greenhouses
  const greenhouses = await prisma.greenhouse.findMany({
    include: {
      activeUserPlant: {
        include: { plant: true },
      },
      owner: true,
    },
  });

  console.log(`📊 Found ${greenhouses.length} greenhouses:`);
  for (const gh of greenhouses) {
    console.log(`\n  🏠 ${gh.name} (ID: ${gh.id})`);
    console.log(`     Owner: ${gh.owner?.email || 'Unknown'}`);
    if (gh.activeUserPlant) {
      console.log(`     Active Plant: ${gh.activeUserPlant.plant.name}`);
      console.log(
        `     Moisture Range: ${gh.activeUserPlant.plant.soil_moisture_initial}% - ${gh.activeUserPlant.plant.soil_moisture_final}%`,
      );
    } else {
      console.log(`     Active Plant: ❌ None configured`);
    }
  }

  // Find greenhouses without active plant
  const needsSetup = greenhouses.filter((gh) => !gh.activeUserPlantId);

  if (needsSetup.length === 0) {
    console.log('\n✅ All greenhouses have an active plant configured!');
    return;
  }

  console.log(`\n⚠️ ${needsSetup.length} greenhouse(s) need an active plant\n`);

  // Get all user plants
  const userPlants = await prisma.userPlant.findMany({
    include: {
      plant: true,
      user: true,
    },
  });

  console.log(`📋 Available UserPlants:`);
  for (const up of userPlants) {
    console.log(`\n  🌱 ${up.plant.name} (UserPlant ID: ${up.id})`);
    console.log(`     User: ${up.user.email}`);
    console.log(
      `     Moisture: ${up.plant.soil_moisture_initial}% - ${up.plant.soil_moisture_final}%`,
    );
  }

  // For each greenhouse without active plant, assign the first user plant of that owner
  for (const gh of needsSetup) {
    console.log(`\n🔧 Setting up greenhouse: ${gh.name}`);

    // Find a user plant for this owner
    const ownerPlant = userPlants.find((up) => up.userId === gh.ownerId);

    if (!ownerPlant) {
      console.log(`   ❌ No UserPlant found for owner ${gh.owner?.email}`);

      // Check if there's any plant in the database
      const anyPlant = await prisma.plant.findFirst();
      if (!anyPlant) {
        console.log(
          `   ❌ No plants found in database. Please run seed first.`,
        );
        continue;
      }

      // Create a UserPlant for this owner
      console.log(`   📝 Creating UserPlant for owner...`);
      const newUserPlant = await prisma.userPlant.create({
        data: {
          userId: gh.ownerId!,
          plantId: anyPlant.id,
          nickname: anyPlant.name,
        },
      });

      // Update greenhouse
      await prisma.greenhouse.update({
        where: { id: gh.id },
        data: { activeUserPlantId: newUserPlant.id },
      });

      console.log(
        `   ✅ Created UserPlant and set as active: ${anyPlant.name}`,
      );
    } else {
      // Update greenhouse with existing user plant
      await prisma.greenhouse.update({
        where: { id: gh.id },
        data: { activeUserPlantId: ownerPlant.id },
      });

      console.log(`   ✅ Set active plant: ${ownerPlant.plant.name}`);
    }
  }

  console.log('\n✅ Setup complete!\n');

  // Verify the result
  const result = await prisma.greenhouse.findFirst({
    where: { activeUserPlantId: { not: null } },
    include: {
      activeUserPlant: {
        include: { plant: true },
      },
    },
  });

  if (result) {
    console.log('📊 Verification - First greenhouse with active plant:');
    console.log(`   Greenhouse: ${result.name} (${result.id})`);
    console.log(`   Plant: ${result.activeUserPlant?.plant.name}`);
    console.log(
      `   Moisture Range: ${result.activeUserPlant?.plant.soil_moisture_initial}% - ${result.activeUserPlant?.plant.soil_moisture_final}%`,
    );

    const ideal =
      ((result.activeUserPlant?.plant.soil_moisture_initial || 30) +
        (result.activeUserPlant?.plant.soil_moisture_final || 70)) /
      2;
    console.log(`   Ideal Moisture: ${ideal}%`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
