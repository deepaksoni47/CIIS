#!/usr/bin/env ts-node
import fs from "fs/promises";
import admin from "firebase-admin";

async function main() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (const a of args) {
    if (a.startsWith("--")) {
      const [k, v] = a.replace(/^--/, "").split("=");
      opts[k] = v || "";
    }
  }

  // Initialize admin SDK. If GOOGLE_APPLICATION_CREDENTIALS is set,
  // admin.initializeApp() will use it. Otherwise allow --serviceAccount
  if (opts.serviceAccount) {
    const json = JSON.parse(await fs.readFile(opts.serviceAccount, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(json) });
  } else {
    admin.initializeApp();
  }

  let uids: string[] = [];

  if (opts.uids) {
    uids = opts.uids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (opts.file) {
    const content = await fs.readFile(opts.file, "utf8");
    const fileUids = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    uids = [...uids, ...fileUids];
  }

  if (!uids.length) {
    console.error(
      "No UIDs provided. Use --uids=uid1,uid2 or --file=path/to/uids.txt"
    );
    process.exit(1);
  }

  // Batch revoke with small concurrency to avoid triggering quota spikes
  const BATCH_SIZE = Number(opts.batchSize || 20);
  const delayMs = Number(opts.delayMs || 250);

  console.log(
    `Revoking refresh tokens for ${uids.length} users (batch ${BATCH_SIZE}, delay ${delayMs}ms)`
  );

  let success = 0;
  let failed = 0;

  for (let i = 0; i < uids.length; i += BATCH_SIZE) {
    const batch = uids.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (uid) => {
        try {
          await admin.auth().revokeRefreshTokens(uid);
          // Optionally read tokensValidAfterTime to log
          const user = await admin.auth().getUser(uid);
          console.log(
            `Revoked ${uid} (tokensValidAfterTime=${user.tokensValidAfterTime})`
          );
          success++;
        } catch (err) {
          console.error(`Failed to revoke ${uid}:`, err.message || err);
          failed++;
        }
      })
    );

    if (i + BATCH_SIZE < uids.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(`Done. success=${success} failed=${failed}`);
  process.exit(failed ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
