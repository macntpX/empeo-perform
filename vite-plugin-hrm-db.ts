import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'empeo-db.json');

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

export function hrmDatabasePlugin(): Plugin {
  return {
    name: 'empeo-hrm-db-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        // Health check
        if (req.method === 'GET' && req.url === '/api/health') {
          ensureDbDir();
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              engine: 'Local File DB (data/empeo-db.json)',
              exists: fs.existsSync(DB_FILE),
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        // Read full persisted HRM state
        if (req.method === 'GET' && req.url === '/api/state') {
          ensureDbDir();
          if (!fs.existsSync(DB_FILE)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ exists: false }));
            return;
          }
          try {
            const raw = fs.readFileSync(DB_FILE, 'utf-8');
            res.statusCode = 200;
            res.end(raw);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read database file' }));
          }
          return;
        }

        // Save/update HRM state (used by all CRUD mutations)
        if ((req.method === 'PUT' || req.method === 'POST') && req.url === '/api/state') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              ensureDbDir();
              fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  ok: true,
                  savedAt: new Date().toISOString(),
                })
              );
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
          return;
        }

        // Reset DB file
        if (req.method === 'DELETE' && req.url === '/api/state') {
          try {
            if (fs.existsSync(DB_FILE)) {
              fs.unlinkSync(DB_FILE);
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to reset DB' }));
          }
          return;
        }

        next();
      });
    },
  };
}

