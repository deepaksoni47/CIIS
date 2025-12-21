import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from project root
dotenv.config({ path: resolve(__dirname, "../../../.env") });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error("❌ Missing Firebase credentials in .env file:");
    console.error(`   FIREBASE_PROJECT_ID: ${projectId ? "✅" : "❌"}`);
    console.error(`   FIREBASE_PRIVATE_KEY: ${privateKey ? "✅" : "❌"}`);
    console.error(`   FIREBASE_CLIENT_EMAIL: ${clientEmail ? "✅" : "❌"}`);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey,
      clientEmail,
    }),
    projectId,
  });

  console.log(`✅ Firebase initialized for project: ${projectId}`);
}

const db = admin.firestore();

async function main() {
  console.log("🌱 Starting Firestore seed...");

  // Sample buildings - Coordinates: 22°07′45″N, 82°08′10″E
  const buildingsData = [
    {
      id: "BLDG-101",
      name: "Engineering Building",
      location: new admin.firestore.GeoPoint(22.1292, 82.1361),
      address: "123 Campus Drive",
      buildingType: "Academic",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "BLDG-102",
      name: "Science Hall",
      location: new admin.firestore.GeoPoint(22.1302, 82.1371),
      address: "456 University Avenue",
      buildingType: "Academic",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "BLDG-103",
      name: "Library",
      location: new admin.firestore.GeoPoint(22.1282, 82.1351),
      address: "789 Academic Way",
      buildingType: "Library",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  // Create buildings
  const batch = db.batch();
  buildingsData.forEach((building) => {
    const ref = db.collection("buildings").doc(building.id);
    batch.set(ref, building, { merge: true });
  });
  await batch.commit();

  console.log(`✅ Created ${buildingsData.length} buildings`);

  // Sample issues
  const categories = ["WATER", "ELECTRICITY", "WIFI", "SANITATION"] as const;
  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

  const issuesBatch = db.batch();
  const issuesData = Array.from({ length: 20 }, (_, i) => {
    const building = buildingsData[i % buildingsData.length];
    const category = categories[i % categories.length];
    const status = statuses[i % statuses.length];

    const issueRef = db.collection("issues").doc();
    const lat = building.location.latitude + (Math.random() - 0.5) * 0.001;
    const lon = building.location.longitude + (Math.random() - 0.5) * 0.001;

    issuesBatch.set(issueRef, {
      category,
      location: new admin.firestore.GeoPoint(lat, lon),
      severity: Math.floor(Math.random() * 5) + 1,
      status,
      description: `Sample ${category.toLowerCase()} issue in ${building.name}`,
      buildingId: building.id,
      reportedBy: `user${i + 1}@campus.edu`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return issueRef.id;
  });

  await issuesBatch.commit();

  console.log(`✅ Created ${issuesData.length} sample issues`);

  console.log("🎉 Firestore seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding Firestore:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
