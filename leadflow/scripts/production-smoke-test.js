const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runProductionSmokeTest() {
  console.log('--- Starting LeadFlow Production Smoke Test ---');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    JWT_SECRET: 'test_production_secret_key_12345678901234567890123456789012',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/leadflow',
    ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  };

  const serverProcess = spawn('node', ['server/server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverReady = false;

  serverProcess.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(`[SERVER] ${text}`);
    if (text.includes('LeadFlow Production Server Ready')) {
      serverReady = true;
    }
  });

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(`[SERVER ERR] ${data.toString()}`);
  });

  // Wait for server to boot (max 10s)
  const startTime = Date.now();
  while (!serverReady && Date.now() - startTime < 10000) {
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!serverReady) {
    serverProcess.kill();
    throw new Error('Server failed to start within timeout window.');
  }

  console.log('\n--- Running Live Production HTTP Assertions ---');

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log(`1. GET /api/health: ${health.statusCode}`);
    if (health.statusCode !== 200) throw new Error('Health check failed');
    const healthJson = JSON.parse(health.body);
    if (healthJson.status !== 'ok') throw new Error('Health status is not ok');

    // 2. SPA Root HTML
    const root = await request('/');
    console.log(`2. GET / (SPA Index): ${root.statusCode}`);
    if (root.statusCode !== 200) throw new Error('Root SPA failed');
    if (!root.body.toLowerCase().includes('<!doctype html>')) throw new Error('Root is not HTML');

    // 3. Deep SPA Route Fallback (public preview)
    const preview = await request('/preview/test_smoke_lead');
    console.log(`3. GET /preview/:id (Concept Mockup): ${preview.statusCode}`);
    if (preview.statusCode !== 200) throw new Error('SPA preview route fallback failed');

    // 4. Tracking Pixel
    const tracking = await request('/api/tracking/open/smoke_msg_123');
    console.log(`4. GET /api/tracking/open/:id (1x1 GIF Pixel): ${tracking.statusCode}, Content-Type: ${tracking.headers['content-type']}`);
    if (tracking.statusCode !== 200 || tracking.headers['content-type'] !== 'image/gif') {
      throw new Error('Tracking pixel failed');
    }

    // 5. Click Tracking Redirect
    const click = await request('/api/tracking/click/smoke_msg_123?url=https://example.com');
    console.log(`5. GET /api/tracking/click/:id: ${click.statusCode}, Location: ${click.headers['location']}`);
    if (click.statusCode !== 302 || click.headers['location'] !== 'https://example.com') {
      throw new Error('Click tracking redirect failed');
    }

    // 6. Unknown API Route (Should return 404 JSON, NOT HTML)
    const notFoundApi = await request('/api/non-existent-smoke-route');
    console.log(`6. GET /api/non-existent-smoke-route: ${notFoundApi.statusCode}`);
    if (notFoundApi.statusCode !== 404) throw new Error('Expected 404 for unknown API route');
    const notFoundJson = JSON.parse(notFoundApi.body);
    if (notFoundJson.success !== false) throw new Error('Expected success: false in 404 JSON');

    // 7. Security Headers check
    console.log(`7. Helmet Headers: x-content-type-options = ${health.headers['x-content-type-options']}`);
    if (health.headers['x-content-type-options'] !== 'nosniff') {
      throw new Error('Missing x-content-type-options header');
    }

    console.log('\n✅ ALL 7 LIVE PRODUCTION ASSERTIONS PASSED!\n');
  } finally {
    // 8. Test Graceful Shutdown
    console.log('Testing Graceful Shutdown via SIGINT...');
    serverProcess.kill('SIGINT');
    await new Promise((resolve) => {
      serverProcess.on('exit', (code, signal) => {
        console.log(`Server exited with code ${code}, signal: ${signal}`);
        resolve();
      });
    });
  }

  console.log('🎉 Production smoke test completed successfully!');
}

runProductionSmokeTest().catch((err) => {
  console.error('❌ Production smoke test failed:', err);
  process.exit(1);
});
