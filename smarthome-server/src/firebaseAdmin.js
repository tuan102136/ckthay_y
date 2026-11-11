import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));

export function initializeFirebaseAdmin(env = process.env) {
  const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountJson && !serviceAccountPath) {
    return null;
  }

  const serviceAccount = serviceAccountJson
    ? JSON.parse(serviceAccountJson)
    : JSON.parse(
        readFileSync(
          path.resolve(serverDirectory, '..', serviceAccountPath),
          'utf8',
        ),
      );

  if (!env.FIREBASE_DATABASE_URL) {
    throw new Error('FIREBASE_DATABASE_URL must be set when Firebase is enabled.');
  }

  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: env.FIREBASE_DATABASE_URL,
      projectId: env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    },
    `smarthome-api-${Date.now()}`,
  );
}
