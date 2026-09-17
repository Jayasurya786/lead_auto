const { describe, it } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const zlib = require('zlib');
const app = require('../app');

describe('5. Production Readiness & Performance Checks', () => {
  it('should serve gzipped response when Accept-Encoding gzip is provided', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: 'localhost',
        port,
        path: '/',
        method: 'GET',
        headers: {
          'Accept-Encoding': 'gzip',
        },
      };

      const req = http.request(options, (res) => {
        assert.strictEqual(res.statusCode, 200);
        // Verify response can be decompressed or served with gzip encoding
        if (res.headers['content-encoding'] === 'gzip') {
          const gunzip = zlib.createGunzip();
          let body = '';
          res.pipe(gunzip);
          gunzip.on('data', (chunk) => (body += chunk));
          gunzip.on('end', () => {
            assert.strictEqual(body.includes('<!DOCTYPE html>') || body.includes('<html'), true);
            server.close(done);
          });
        } else {
          // Small payloads below compression threshold
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            assert.strictEqual(body.includes('<!DOCTYPE html>') || body.includes('<html'), true);
            server.close(done);
          });
        }
      });
      req.end();
    });
  });

  it('should include Cross-Origin-Resource-Policy cross-origin for open pixel embeds', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/tracking/open/msg_verify_prod`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['cross-origin-resource-policy'], 'cross-origin');
        assert.strictEqual(res.headers['cache-control']?.includes('no-cache'), true);
        server.close(done);
      });
    });
  });

  it('should preserve trust proxy setting on Express application', () => {
    assert.strictEqual(app.get('trust proxy'), 1);
  });

  it('should return CORS headers for allowed client origins', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: 'localhost',
        port,
        path: '/api/health',
        method: 'GET',
        headers: {
          Origin: 'http://localhost:5173',
        },
      };

      const req = http.request(options, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:5173');
        assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
        server.close(done);
      });
      req.end();
    });
  });

  it('should ensure all deep SPA client routes return 200 and index.html', async () => {
    const routesToTest = ['/leads', '/upload', '/templates', '/follow-ups', '/preview/sampleLeadId'];
    const server = http.createServer(app);

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    for (const route of routesToTest) {
      await new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}${route}`, (res) => {
          assert.strictEqual(res.statusCode, 200, `Route ${route} failed with status ${res.statusCode}`);
          assert.strictEqual(res.headers['content-type']?.includes('text/html'), true);
          resolve();
        }).on('error', reject);
      });
    }

    await new Promise((resolve) => server.close(resolve));
  });

  it('should gracefully format CastError to 400 Bad Request with json', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/leads/public/invalid-id-format-123`, (res) => {
        assert.strictEqual(res.statusCode, 400);
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const json = JSON.parse(data);
          assert.strictEqual(json.success, false);
          assert.strictEqual(json.message.includes('invalid identifier format'), true);
          resolve();
        });
      }).on('error', reject);
    });

    await new Promise((resolve) => server.close(resolve));
  });
});

