import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Sample buildings
  const buildings = await Promise.all([
    prisma.building.upsert({
      where: { id: "BLDG-101" },
      update: {},
      create: {
        id: "BLDG-101",
        name: "Engineering Building",
        latitude: 40.7128,
        longitude: -74.006,
        address: "123 Campus Drive",
        buildingType: "Academic",
      },
    }),
    prisma.building.upsert({
      where: { id: "BLDG-102" },
      update: {},
      create: {
        id: "BLDG-102",
        name: "Science Hall",
        latitude: 40.7138,
        longitude: -74.007,
        address: "456 University Avenue",
        buildingType: "Academic",
      },
    }),
    prisma.building.upsert({
      where: { id: "BLDG-103" },
      update: {},
      create: {
        id: "BLDG-103",
        name: "Library",
        latitude: 40.712,
        longitude: -74.005,
        address: "789 Academic Way",
        buildingType: "Library",
      },
    }),
  ]);

  console.log(`✅ Created ${buildings.length} buildings`);

  // Sample issues
  const categories = ["WATER", "ELECTRICITY", "WIFI", "SANITATION"] as const;
  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

  const issues = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const building = buildings[i % buildings.length];
      const category = categories[i % categories.length];
      const status = statuses[i % statuses.length];

      return prisma.issue.create({
        data: {
          category,
          latitude: building.latitude + (Math.random() - 0.5) * 0.001,
          longitude: building.longitude + (Math.random() - 0.5) * 0.001,
          severity: Math.floor(Math.random() * 5) + 1,
          status,
          description: `Sample ${category.toLowerCase()} issue in ${
            building.name
          }`,
          buildingId: building.id,
          reportedBy: `user${i + 1}@campus.edu`,
        },
      });
    })
  );

  console.log(`✅ Created ${issues.length} sample issues`);

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
