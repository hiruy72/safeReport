import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const region = await prisma.region.upsert({
    where: { name: "Addis Ababa" },
    update: {},
    create: { name: "Addis Ababa" },
  });

  const city = await prisma.city.upsert({
    where: { name_regionId: { name: "Addis Ababa", regionId: region.id } },
    update: {},
    create: { name: "Addis Ababa", regionId: region.id },
  });

  const station = await prisma.policeStation.upsert({
    where: { id: "seed-station-bole" },
    update: {},
    create: {
      id: "seed-station-bole",
      name: "Bole Police Station",
      address: "Bole Sub City, Addis Ababa",
      phone: "+251-11-000-0000",
      latitude: 8.9972,
      longitude: 38.7899,
      regionId: region.id,
      cityId: city.id,
    },
  });

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@safeher.local" },
    update: {},
    create: {
      email: "admin@safeher.local",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: { firstName: "System", lastName: "Admin" },
      },
    },
  });

  console.log("Seed complete:");
  console.log(`  Region: ${region.name}`);
  console.log(`  Station: ${station.name}`);
  console.log(`  Admin: ${adminUser.email} / Admin123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
