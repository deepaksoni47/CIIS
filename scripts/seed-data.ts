import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function main() {
  console.log("🌱 Starting Firestore seed...");

  // Sample buildings
  const buildingsData = [
    {
      id: "BLDG-101",
      name: "Engineering Building",
      location: new admin.firestore.GeoPoint(40.7128, -74.006),
      address: "123 Campus Drive",
      buildingType: "Academic",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "BLDG-102",
      name: "Science Hall",
      location: new admin.firestore.GeoPoint(40.7138, -74.007),
      address: "456 University Avenue",
      buildingType: "Academic",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "BLDG-103",
      name: "Library",
      location: new admin.firestore.GeoPoint(40.712, -74.005),
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
