import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import { initializeFirebase, getFirestore, createGeoPoint, COLLECTIONS } from "../config/firebase";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

/**
 * Seed GGV University data with comprehensive structure
 */
async function seedGGVData() {
  try {
    console.log("🌱 Starting GGV data seeding...\n");

    initializeFirebase();
    const db = getFirestore();

    // 1. Create Organization (GGV)
    console.log("📍 Creating organization...");
    const orgId = "ggv-bilaspur";
    const orgRef = db.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    await orgRef.set({
      id: orgId,
      name: "Guru Ghasidas Vishwavidyalaya",
      shortName: "GGV",
      address: "Koni, Bilaspur",
      city: "Bilaspur",
      state: "Chhattisgarh",
      country: "India",
      campusCenter: createGeoPoint(22.131, 82.1495),
      campusBounds: {
        northWest: createGeoPoint(22.1515, 82.134),
        northEast: createGeoPoint(22.1515, 82.1655),
        southWest: createGeoPoint(22.115, 82.134),
        southEast: createGeoPoint(22.115, 82.1655),
      },
      contactEmail: "info@ggu.ac.in",
      contactPhone: "+91-7752-260910",
      website: "https://www.ggu.ac.in",
      timezone: "Asia/Kolkata",
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Organization created: GGV\n");

    // 2. Create Departments
    console.log("🏛️  Creating departments...");
    const departments = [
      { id: "dept-cse", code: "CSE", name: "Computer Science & Engineering" },
      { id: "dept-ece", code: "ECE", name: "Electronics & Communication Engineering" },
      { id: "dept-ee", code: "EE", name: "Electrical Engineering" },
      { id: "dept-me", code: "ME", name: "Mechanical Engineering" },
      { id: "dept-civil", code: "CIVIL", name: "Civil Engineering" },
      { id: "dept-physics", code: "PHY", name: "Department of Physics" },
      { id: "dept-chemistry", code: "CHEM", name: "Department of Chemistry" },
      { id: "dept-maths", code: "MATH", name: "Department of Mathematics" },
      { id: "dept-lib", code: "LIB", name: "Central Library" },
      { id: "dept-admin", code: "ADMIN", name: "Administration" },
    ];

    for (const dept of departments) {
      await db
        .collection(COLLECTIONS.DEPARTMENTS)
        .doc(dept.id)
        .set({
          id: dept.id,
          organizationId: orgId,
          name: dept.name,
          code: dept.code,
          contactEmail: `${dept.code.toLowerCase()}@ggu.ac.in`,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    console.log(`✅ ${departments.length} departments created\n`);

    // 3. Create Buildings
    console.log("🏢 Creating buildings...");
    const buildings = [
      {
        id: "bldg-engineering",
        name: "Engineering Block A",
        code: "ENG-A",
        location: createGeoPoint(22.1335, 82.147),
        departmentId: "dept-cse",
        buildingType: "Academic",
        floors: 4,
        totalArea: 5000,
        constructionYear: 2010,
      },
      {
        id: "bldg-science",
        name: "Science Block",
        code: "SCI",
        location: createGeoPoint(22.1325, 82.1485),
        departmentId: "dept-physics",
        buildingType: "Academic",
        floors: 3,
        totalArea: 4000,
        constructionYear: 2008,
      },
      {
        id: "bldg-library",
        name: "Central Library",
        code: "LIB",
        location: createGeoPoint(22.131, 82.15),
        departmentId: "dept-lib",
        buildingType: "Library",
        floors: 3,
        totalArea: 3500,
        constructionYear: 2012,
      },
      {
        id: "bldg-admin",
        name: "Administrative Block",
        code: "ADMIN",
        location: createGeoPoint(22.1305, 82.1495),
        departmentId: "dept-admin",
        buildingType: "Administrative",
        floors: 2,
        totalArea: 2500,
        constructionYear: 2005,
      },
      {
        id: "bldg-hostel-boys",
        name: "Boys Hostel Block 1",
        code: "BH-1",
        location: createGeoPoint(22.1345, 82.1515),
        buildingType: "Residential",
        floors: 4,
        totalArea: 6000,
        constructionYear: 2015,
      },
      {
        id: "bldg-hostel-girls",
        name: "Girls Hostel Block 1",
        code: "GH-1",
        location: createGeoPoint(22.1295, 82.1515),
        buildingType: "Residential",
        floors: 4,
        totalArea: 6000,
        constructionYear: 2016,
      },
      {
        id: "bldg-auditorium",
        name: "University Auditorium",
        code: "AUD",
        location: createGeoPoint(22.132, 82.149),
        buildingType: "Auditorium",
        floors: 2,
        totalArea: 3000,
        constructionYear: 2018,
      },
      {
        id: "bldg-sports",
        name: "Sports Complex",
        code: "SPORTS",
        location: createGeoPoint(22.135, 82.151),
        buildingType: "Recreational",
        floors: 2,
        totalArea: 4500,
        constructionYear: 2017,
      },
    ];

    for (const building of buildings) {
      await db
        .collection(COLLECTIONS.BUILDINGS)
        .doc(building.id)
        .set({
          ...building,
          organizationId: orgId,
          address: `${building.name}, GGV Campus, Bilaspur`,
          status: "active" as const,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    console.log(`✅ ${buildings.length} buildings created\n`);

    // 4. Create Sample Rooms
    console.log("🚪 Creating rooms...");
    const rooms = [
      // Engineering Block A
      { buildingId: "bldg-engineering", roomNumber: "101", floor: 1, roomType: "classroom", capacity: 60, hasAC: true, hasProjector: true },
      { buildingId: "bldg-engineering", roomNumber: "102", floor: 1, roomType: "lab", capacity: 30, hasAC: true, hasProjector: true },
      { buildingId: "bldg-engineering", roomNumber: "201", floor: 2, roomType: "classroom", capacity: 80, hasAC: true, hasProjector: true },
      { buildingId: "bldg-engineering", roomNumber: "301", floor: 3, roomType: "lab", capacity: 40, hasAC: true, hasProjector: false },
      // Science Block
      { buildingId: "bldg-science", roomNumber: "101", floor: 1, roomType: "lab", capacity: 30, hasAC: false, hasProjector: false },
      { buildingId: "bldg-science", roomNumber: "201", floor: 2, roomType: "classroom", capacity: 50, hasAC: true, hasProjector: true },
      // Library
      { buildingId: "bldg-library", roomNumber: "G01", floor: 0, roomType: "library", capacity: 200, hasAC: true, hasProjector: false },
      { buildingId: "bldg-library", roomNumber: "201", floor: 2, roomType: "library", capacity: 100, hasAC: true, hasProjector: false },
      // Auditorium
      { buildingId: "bldg-auditorium", roomNumber: "Main Hall", floor: 1, roomType: "auditorium", capacity: 500, hasAC: true, hasProjector: true },
    ];

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      await db.collection(COLLECTIONS.ROOMS).add({
        id: `room-${i + 1}`,
        organizationId: orgId,
        departmentId: "dept-cse",
        ...room,
        status: "active" as const,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✅ ${rooms.length} rooms created\n`);

    // 5. Create Sample Users
    console.log("👥 Creating users...");
    const users = [
      {
        id: "user-admin",
        email: "admin@ggu.ac.in",
        name: "Campus Administrator",
        role: "admin" as const,
        permissions: {
          canCreateIssues: true,
          canResolveIssues: true,
          canAssignIssues: true,
          canViewAllIssues: true,
          canManageUsers: true,
        },
      },
      {
        id: "user-facility",
        email: "facility@ggu.ac.in",
        name: "Facility Manager",
        role: "facility_manager" as const,
        permissions: {
          canCreateIssues: true,
          canResolveIssues: true,
          canAssignIssues: true,
          canViewAllIssues: true,
          canManageUsers: false,
        },
      },
      {
        id: "user-student1",
        email: "student1@ggu.ac.in",
        name: "Deepak Soni",
        role: "student" as const,
        departmentId: "dept-cse",
        permissions: {
          canCreateIssues: true,
          canResolveIssues: false,
          canAssignIssues: false,
          canViewAllIssues: false,
          canManageUsers: false,
        },
      },
    ];

    for (const user of users) {
      await db
        .collection(COLLECTIONS.USERS)
        .doc(user.id)
        .set({
          ...user,
          organizationId: orgId,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    console.log(`✅ ${users.length} users created\n`);

    // 6. Create Sample Issues
    console.log("🔧 Creating sample issues...");
    const issues = [
      {
        buildingId: "bldg-engineering",
        departmentId: "dept-cse",
        title: "Broken AC in Classroom 201",
        description: "Air conditioning unit not working, making the classroom unbearably hot",
        category: "HVAC",
        severity: 7,
        priority: "high",
        submissionType: "text",
        reportedBy: "user-student1",
        reportedByRole: "student",
      },
      {
        buildingId: "bldg-library",
        departmentId: "dept-lib",
        title: "WiFi Not Working in Reading Hall",
        description: "Students unable to access online resources due to WiFi failure",
        category: "Network",
        severity: 6,
        priority: "medium",
        submissionType: "text",
        reportedBy: "user-student1",
        reportedByRole: "student",
      },
      {
        buildingId: "bldg-science",
        departmentId: "dept-physics",
        title: "Water Leakage in Lab 101",
        description: "Ceiling is leaking water, damaging equipment",
        category: "Plumbing",
        severity: 9,
        priority: "critical",
        submissionType: "text",
        reportedBy: "user-facility",
        reportedByRole: "facility_manager",
      },
      {
        buildingId: "bldg-hostel-boys",
        title: "Broken Bathroom Door",
        description: "Door lock is broken in Room 305 bathroom",
        category: "Maintenance",
        severity: 4,
        priority: "low",
        submissionType: "text",
        reportedBy: "user-student1",
        reportedByRole: "student",
      },
      {
        buildingId: "bldg-engineering",
        departmentId: "dept-cse",
        title: "Projector Not Working in Lab 102",
        description: "Display projector shows no signal",
        category: "Electrical",
        severity: 5,
        priority: "medium",
        submissionType: "text",
        reportedBy: "user-student1",
        reportedByRole: "student",
      },
    ];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const building = buildings.find((b) => b.id === issue.buildingId);
      if (!building) continue;

      await db.collection(COLLECTIONS.ISSUES).add({
        ...issue,
        organizationId: orgId,
        location: building.location,
        status: i < 2 ? "open" : "in_progress",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✅ ${issues.length} issues created\n`);

    console.log("✅ GGV data seeding completed successfully!");
    console.log(`
📊 Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 1 Organization (GGV)
✓ ${departments.length} Departments
✓ ${buildings.length} Buildings
✓ ${rooms.length} Rooms
✓ ${users.length} Users
✓ ${issues.length} Sample Issues
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding GGV data:", error);
    process.exit(1);
  }
}

// Run seeding
seedGGVData();
