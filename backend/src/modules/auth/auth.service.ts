import * as admin from "firebase-admin";
import { getAuth, getFirestore } from "../../config/firebase";
import { User, UserRole } from "../../types";

/**
 * Verify Firebase ID token from client
 */
export async function verifyIdToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken> {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Get or create user in Firestore after Google OAuth login
 */
export async function getOrCreateUser(
  firebaseUser: admin.auth.DecodedIdToken,
  organizationId: string,
  role?: UserRole
): Promise<User> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(firebaseUser.uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    // Update last login
    await userRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  // Create new user
  const newUser: Omit<User, "id"> = {
    organizationId,
    email: firebaseUser.email || "",
    name: firebaseUser.name || firebaseUser.email?.split("@")[0] || "User",
    role: role || "student",
    isActive: true,
    permissions: getDefaultPermissions(role || "student"),
    createdAt:
      admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    updatedAt:
      admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    lastLogin:
      admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
  };

  await userRef.set(newUser);
  return { id: firebaseUser.uid, ...newUser } as User;
}

/**
 * Get default permissions based on role
 */
function getDefaultPermissions(role: UserRole) {
  switch (role) {
    case "admin":
      return {
        canCreateIssues: true,
        canResolveIssues: true,
        canAssignIssues: true,
        canViewAllIssues: true,
        canManageUsers: true,
      };
    case "facility_manager":
      return {
        canCreateIssues: true,
        canResolveIssues: true,
        canAssignIssues: true,
        canViewAllIssues: true,
        canManageUsers: false,
      };
    case "staff":
      return {
        canCreateIssues: true,
        canResolveIssues: true,
        canAssignIssues: false,
        canViewAllIssues: false,
        canManageUsers: false,
      };
    case "faculty":
      return {
        canCreateIssues: true,
        canResolveIssues: false,
        canAssignIssues: false,
        canViewAllIssues: false,
        canManageUsers: false,
      };
    case "student":
    default:
      return {
        canCreateIssues: true,
        canResolveIssues: false,
        canAssignIssues: false,
        canViewAllIssues: false,
        canManageUsers: false,
      };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const db = getFirestore();
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  // Don't allow updating sensitive fields
  const { id, organizationId, createdAt, ...safeUpdates } = updates;

  await userRef.update({
    ...safeUpdates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as User;
}

/**
 * Get users by organization
 */
export async function getUsersByOrganization(
  organizationId: string,
  role?: UserRole
): Promise<User[]> {
  const db = getFirestore();
  let query = db
    .collection("users")
    .where("organizationId", "==", organizationId)
    .where("isActive", "==", true);

  if (role) {
    query = query.where("role", "==", role);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
}

/**
 * Deactivate user
 */
export async function deactivateUser(userId: string): Promise<void> {
  const db = getFirestore();
  await db.collection("users").doc(userId).update({
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<User> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  await userRef.update({
    role: newRole,
    permissions: getDefaultPermissions(newRole),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as User;
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  userId: string,
  permission: keyof User["permissions"]
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.isActive) {
    return false;
  }
  return user.permissions[permission] === true;
}
