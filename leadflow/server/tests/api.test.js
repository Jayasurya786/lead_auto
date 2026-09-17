const { describe, it } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../app');

describe('4. API Health and Route Integrity', () => {
  it('should respond with 200 OK on /api/health', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/health`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const json = JSON.parse(body);
          assert.strictEqual(json.status, 'ok');
          assert.strictEqual(json.app, 'LeadFlow API');
          server.close(done);
        });
      });
    });
  });

  it('should reject unauthenticated access to /api/leads with 401', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/leads`, (res) => {
        assert.strictEqual(res.statusCode, 401);
        server.close(done);
      });
    });
  });

  it('should reject unauthenticated access to /api/contacts with 401', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/contacts`, (res) => {
        assert.strictEqual(res.statusCode, 401);
        server.close(done);
      });
    });
  });

  it('should serve 1x1 GIF on /api/tracking/open/:id with 200 OK', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/tracking/open/test123456`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type'], 'image/gif');
        server.close(done);
      });
    });
  });

  it('should redirect on /api/tracking/click/:id with 302 Found', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/tracking/click/test123456?url=https://example.com`, (res) => {
        assert.strictEqual(res.statusCode, 302);
        assert.strictEqual(res.headers['location'], 'https://example.com');
        server.close(done);
      });
    });
  });

  it('should serve SPA index.html on root / with 200 OK', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type']?.includes('text/html'), true);
        assert.strictEqual(res.headers['cache-control']?.includes('no-cache'), true);
        server.close(done);
      });
    });
  });

  it('should fallback to SPA index.html on client routes like /preview/:id with 200 OK', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/preview/testlead123`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type']?.includes('text/html'), true);
        server.close(done);
      });
    });
  });

  it('should return 404 JSON on unhandled /api/* routes instead of HTML', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/nonexistent-route-12345`, (res) => {
        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.headers['content-type']?.includes('application/json'), true);
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const json = JSON.parse(body);
          assert.strictEqual(json.success, false);
          assert.strictEqual(json.message.includes('Not Found'), true);
          server.close(done);
        });
      });
    });
  });

  it('should include production security headers from Helmet', (t, done) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      http.get(`http://localhost:${port}/api/health`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
        assert.strictEqual(res.headers['x-dns-prefetch-control'], 'off');
        server.close(done);
      });
    });
  });
});

