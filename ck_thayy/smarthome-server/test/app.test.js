import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';

const app = createApp({
  firebaseApp: null,
  deviceToken: 'test-device-token',
  allowDemoAlerts: true,
});
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
  });
});

test('health reports missing Firebase setup without hiding it', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    firebase: 'missing_service_account',
    deviceAuth: 'configured',
  });
});

test('device alert rejects invalid credentials and malformed payloads', async () => {
  const unauthorized = await fetch(`${baseUrl}/api/iot/alert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-device-token': 'wrong',
    },
    body: JSON.stringify({
      deviceId: 'wokwi-esp32',
      type: 'temperature',
      value: 40,
    }),
  });
  assert.equal(unauthorized.status, 401);

  const invalid = await fetch(`${baseUrl}/api/iot/alert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-device-token': 'test-device-token',
    },
    body: JSON.stringify({
      deviceId: 'wokwi-esp32',
      type: 'temperature',
      value: '40',
    }),
  });
  assert.equal(invalid.status, 400);
});

test('valid device alert is visible in the alert feed and reports push setup', async () => {
  const response = await fetch(`${baseUrl}/api/iot/alert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-device-token': 'test-device-token',
    },
    body: JSON.stringify({
      deviceId: 'wokwi-esp32',
      type: 'temperature',
      value: 39.5,
      threshold: 35,
    }),
  });
  assert.equal(response.status, 202);

  const result = await response.json();
  assert.equal(result.accepted, true);
  assert.deepEqual(result.push, { status: 'not_configured', sent: 0 });

  const feedResponse = await fetch(`${baseUrl}/api/iot/alerts`);
  const feed = await feedResponse.json();
  assert.equal(feed.alerts[0].deviceId, 'wokwi-esp32');
  assert.equal(feed.alerts[0].value, 39.5);
});

test('demo endpoint accepts test alerts only when enabled', async () => {
  const response = await fetch(`${baseUrl}/api/demo/alert`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      deviceId: 'web-test',
      type: 'smoke',
      value: 1,
    }),
  });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).alert.demo, true);
});
