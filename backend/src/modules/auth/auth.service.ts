import * as admin from "firebase-admin";
import { getAuth, getFirestore } from "../../config/firebase";
import { User, UserRole } from "../../types";

/**
 * Verify Firebase ID token from client
 */
export async function verifyIdToken(
  idToken: string,
): Promise<admin.auth.DecodedIdToken> {
  try {
    const auth = getAuth();
    console.log("🔐 Verifying token, length:", idToken.length);
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("✅ Token verified for user:", decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    if (error instanceof Error) {
      throw new Error(`Invalid or expired token: ${error.message}`);
    }
    throw new Error("Invalid or expired token");
  }
}

/**
 * Get or create user in Firestore after Google OAuth login
 */
export async function getOrCreateUser(
  firebaseUser: admin.auth.DecodedIdToken,
  organizationId: string,
  role?: UserRole,
): Promise<{ user: User; isNewUser: boolean }> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(firebaseUser.uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    // Update last login
    await userRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
      user: { id: userDoc.id, ...userDoc.data() } as User,
      isNewUser: false,
    };
  }

  // Create new user
  const newUser: Omit<User, "id"> = {
    organizationId,
    email: firebaseUser.email || "",
    name: firebaseUser.name || firebaseUser.email?.split("@")[0] || "User",
    role: role || UserRole.STUDENT,
    isActive: true,
    permissions: getDefaultPermissions(role || UserRole.STUDENT),
    badges: [],
    rewardPoints: 0,
    level: 1,
    statistics: {
      issuesReported: 0,
      issuesResolved: 0,
      votesReceived: 0,
      votesCast: 0,
      helpfulReports: 0,
    },
    createdAt:
      admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    updatedAt:
      admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    lastLogin:
      admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
  };

  await userRef.set(newUser);
  return {
    user: { id: firebaseUser.uid, ...newUser } as User,
    isNewUser: true,
  };
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
 * Create user with email and password
 */
export async function createUserWithEmail(
  email: string,
  password: string,
  name: string,
  organizationId: string,
  role?: UserRole,
): Promise<{ user: User; token: string }> {
  const auth = getAuth();
  const db = getFirestore();

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const newUser: Omit<User, "id"> = {
      organizationId,
      email,
      name,
      role: role || UserRole.STUDENT,
      isActive: true,
      permissions: getDefaultPermissions(role || UserRole.STUDENT),
      badges: [],
      rewardPoints: 0,
      level: 1,
      statistics: {
        issuesReported: 0,
        issuesResolved: 0,
        votesReceived: 0,
        votesCast: 0,
        helpfulReports: 0,
      },
      createdAt:
        admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      lastLogin:
        admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    await db.collection("users").doc(userRecord.uid).set(newUser);

    // Sign in the newly created user to get an ID token
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      throw new Error("Firebase API key not configured");
    }

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    if (!authResponse.ok) {
      throw new Error("Failed to authenticate newly created user");
    }

    const authData = (await authResponse.json()) as {
      idToken: string;
    };

    return {
      user: { id: userRecord.uid, ...newUser } as User,
      token: authData.idToken,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("email-already-exists")) {
        throw new Error("Email already registered");
      }
    }
    throw new Error("Failed to create user account");
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateWithEmail(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const db = getFirestore();

  try {
    // Verify credentials using Firebase Auth REST API
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      throw new Error("Firebase API key not configured");
    }

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    if (!authResponse.ok) {
      const errorData = (await authResponse.json()) as {
        error?: { message?: string };
      };
      throw new Error(errorData.error?.message || "Invalid credentials");
    }

    const authData = (await authResponse.json()) as {
      localId: string;
      idToken: string;
    };
    const uid = authData.localId;

    // Get user profile from Firestore
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      throw new Error("User profile not found");
    }

    const userData = userDoc.data() as Omit<User, "id">;

    // Check if user is active
    if (!userData.isActive) {
      throw new Error("User account is deactivated");
    }

    // Update last login
    await db.collection("users").doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return the ID token from Firebase Auth
    const token = authData.idToken;

    return {
      user: { id: uid, ...userData } as User,
      token,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("User profile not found")) {
        throw error;
      }
      if (error.message.includes("account is deactivated")) {
        throw error;
      }
      if (error.message.includes("INVALID_PASSWORD")) {
        throw new Error("Invalid email or password");
      }
      if (error.message.includes("EMAIL_NOT_FOUND")) {
        throw new Error("Invalid email or password");
      }
      if (error.message.includes("USER_DISABLED")) {
        throw new Error("User account has been disabled");
      }
    }
    throw new Error("Invalid email or password");
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
  updates: Partial<User>,
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
  role?: UserRole,
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
  newRole: UserRole,
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
  permission: keyof User["permissions"],
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.isActive) {
    return false;
  }
  return user.permissions[permission] === true;
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const auth = getAuth();
  const db = getFirestore();

  try {
    // Get user email from Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    const email = userData.email;

    // Verify current password by attempting sign-in
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      throw new Error("Firebase API key not configured");
    }

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: currentPassword,
          returnSecureToken: true,
        }),
      },
    );

    if (!authResponse.ok) {
      throw new Error("Current password is incorrect");
    }

    // Update password in Firebase Auth
    await auth.updateUser(userId, {
      password: newPassword,
    });

    // Update timestamp in Firestore
    await db.collection("users").doc(userId).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Current password is incorrect")) {
        throw error;
      }
      if (error.message.includes("INVALID_PASSWORD")) {
        throw new Error("Current password is incorrect");
      }
    }
    throw new Error("Failed to change password");
  }
}
