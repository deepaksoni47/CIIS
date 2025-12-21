import "../env";
import { getFirestore } from "../config/firebase";

async function testFirestoreIssues() {
  try {
    const db = getFirestore();

    console.log("🔍 Querying Firestore for issues...\n");

    const snapshot = await db
      .collection("issues")
      .where("organizationId", "==", "ggv-bilaspur")
      .limit(5)
      .get();

    console.log(`✅ Found ${snapshot.size} issues\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Issue:", data.title);
      console.log("  Priority:", data.priority);
      console.log("  Status:", data.status);
      console.log("  Category:", data.category);
      console.log("  Location:", data.location);
      console.log("");
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testFirestoreIssues();
