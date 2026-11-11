import { createHash, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { initializeFirebaseAdmin } from './firebaseAdmin.js';

const alertTypes = new Set(['temperature', 'smoke', 'water_leak']);

function isValidDeviceToken(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') {
    return false;
  }

  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}

function validateAlert(body) {
  if (
    !body ||
    typeof body.deviceId !== 'string' ||
    body.deviceId.length < 1 ||
    body.deviceId.length > 100
  ) {
    return 'deviceId must be a non-empty string of at most 100 characters.';
  }

  if (!alertTypes.has(body.type)) {
    return `type must be one of: ${[...alertTypes].join(', ')}.`;
  }

  if (typeof body.value !== 'number' || !Number.isFinite(body.value)) {
    return 'value must be a finite number.';
  }

  if (
    body.threshold !== undefined &&
    (typeof body.threshold !== 'number' || !Number.isFinite(body.threshold))
  ) {
    return 'threshold must be a finite number.';
  }

  if (
    body.homeId !== undefined &&
    (typeof body.homeId !== 'string' || body.homeId.length > 100)
  ) {
    return 'homeId must be a string of at most 100 characters.';
  }

  return null;
}

function getBearerToken(request) {
  const authorization = request.get('authorization') || '';
  return authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
}

async function sendPushNotification(firebaseApp, alert) {
  if (!firebaseApp) {
    return { status: 'not_configured', sent: 0 };
  }

  const snapshot = await firebaseApp
    .database()
    .ref('notificationTokens')
    .once('value');
  const tokenRecords = [];

  snapshot.forEach(userSnapshot => {
    userSnapshot.forEach(tokenSnapshot => {
      const record = tokenSnapshot.val();
      if (
        record &&
        typeof record.token === 'string' &&
        (!alert.homeId || record.homeId === alert.homeId)
      ) {
        tokenRecords.push({
          path: tokenSnapshot.ref,
          token: record.token,
        });
      }
    });
  });

  if (tokenRecords.length === 0) {
    return { status: 'no_devices', sent: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (let index = 0; index < tokenRecords.length; index += 500) {
    const batch = tokenRecords.slice(index, index + 500);
    const result = await firebaseApp.messaging().sendEachForMulticast({
      tokens: batch.map(record => record.token),
      notification: {
        title: 'SmartHome: cảnh báo',
        body: `${alert.deviceId}: ${alert.value} ${alert.unit || ''}`.trim(),
      },
      data: {
        alertId: alert.id,
        deviceId: alert.deviceId,
        type: alert.type,
        value: String(alert.value),
      },
    });

    sent += result.successCount;
    failed += result.failureCount;

    await Promise.all(
      result.responses.map((response, responseIndex) => {
        if (
          response.success ||
          ![
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
          ].includes(response.error?.code)
        ) {
          return Promise.resolve();
        }

        return batch[responseIndex].path.remove();
      }),
    );
  }

  return { status: failed ? 'partial' : 'sent', sent, failed };
}

export function createApp({
  firebaseApp = initializeFirebaseAdmin(),
  deviceToken = process.env.IOT_DEVICE_TOKEN,
  allowDemoAlerts = process.env.NODE_ENV !== 'production',
} = {}) {
  const app = express();
  const alerts = [];

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use((request, response, next) => {
    const allowedOrigin = process.env.WEB_ORIGIN || 'http://localhost:5173';
    const origin = request.get('origin');

    if (origin && origin === allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
    }

    if (request.method === 'OPTIONS') {
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Device-Token',
      );
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      return response.sendStatus(204);
    }

    return next();
  });

  app.get('/api/health', (request, response) => {
    response.json({
      status: 'ok',
      firebase: firebaseApp ? 'configured' : 'missing_service_account',
      deviceAuth: deviceToken ? 'configured' : 'missing_device_token',
    });
  });

  app.get('/api/iot/alerts', (request, response) => {
    const requestedLimit = Number.parseInt(request.query.limit, 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 20;
    response.json({ alerts: alerts.slice(0, limit) });
  });

  app.post('/api/iot/alert', async (request, response) => {
    if (!deviceToken) {
      return response.status(503).json({
        error: 'IOT_DEVICE_TOKEN is not configured on the server.',
      });
    }

    if (!isValidDeviceToken(request.get('x-device-token'), deviceToken)) {
      return response.status(401).json({ error: 'Invalid device token.' });
    }

    const validationError = validateAlert(request.body);
    if (validationError) {
      return response.status(400).json({ error: validationError });
    }

    const alert = {
      id: createHash('sha256')
        .update(`${Date.now()}-${request.body.deviceId}-${request.body.value}`)
        .digest('hex')
        .slice(0, 16),
      ...request.body,
      receivedAt: new Date().toISOString(),
    };

    alerts.unshift(alert);
    alerts.splice(100);

    try {
      const push = await sendPushNotification(firebaseApp, alert);
      return response.status(202).json({ accepted: true, alert, push });
    } catch (error) {
      console.error('Firebase push failed:', error);
      return response.status(202).json({
        accepted: true,
        alert,
        push: { status: 'failed', error: error.message },
      });
    }
  });

  app.post('/api/devices/register', async (request, response) => {
    if (!firebaseApp) {
      return response.status(503).json({
        error: 'Firebase service-account credentials are not configured.',
      });
    }

    const token = getBearerToken(request);
    if (!token) {
      return response.status(401).json({ error: 'A Firebase ID token is required.' });
    }

    const { messagingToken, homeId } = request.body || {};
    if (
      typeof messagingToken !== 'string' ||
      messagingToken.length < 20 ||
      typeof homeId !== 'string' ||
      homeId.length < 1 ||
      homeId.length > 100
    ) {
      return response.status(400).json({
        error: 'messagingToken and homeId are required.',
      });
    }

    try {
      const decodedToken = await firebaseApp.auth().verifyIdToken(token);
      const tokenId = createHash('sha256').update(messagingToken).digest('hex');
      await firebaseApp
        .database()
        .ref(`notificationTokens/${decodedToken.uid}/${tokenId}`)
        .set({
          token: messagingToken,
          homeId,
          updatedAt: new Date().toISOString(),
        });

      return response.status(201).json({ registered: true });
    } catch (error) {
      console.error('Device registration failed:', error);
      return response.status(401).json({
        error: 'Could not verify the Firebase account or save the device.',
      });
    }
  });

  app.post('/api/demo/alert', async (request, response) => {
    if (!allowDemoAlerts) {
      return response.sendStatus(404);
    }

    const validationError = validateAlert(request.body);
    if (validationError) {
      return response.status(400).json({ error: validationError });
    }

    const alert = {
      id: createHash('sha256')
        .update(`demo-${Date.now()}-${request.body.deviceId}`)
        .digest('hex')
        .slice(0, 16),
      ...request.body,
      receivedAt: new Date().toISOString(),
      demo: true,
    };

    alerts.unshift(alert);
    alerts.splice(100);

    try {
      const push = await sendPushNotification(firebaseApp, alert);
      return response.status(202).json({ accepted: true, alert, push });
    } catch (error) {
      console.error('Demo Firebase push failed:', error);
      return response.status(202).json({
        accepted: true,
        alert,
        push: { status: 'failed', error: error.message },
      });
    }
  });

  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'Request body must be valid JSON.' });
    }

    console.error('Unhandled API error:', error);
    return response.status(500).json({ error: 'Unexpected server error.' });
  });

  return app;
}
