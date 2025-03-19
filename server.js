const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { exec } = require('child_process');
const tcpPortUsed = require('tcp-port-used');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function checkAndKillPort() {
  try {
    const inUse = await tcpPortUsed.check(port, hostname);
    if (inUse) {
      if (process.platform === 'win32') {
        exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
          if (stdout) {
            const lines = stdout.trim().split('\n');
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              exec(`taskkill /F /PID ${pid}`, (error, stdout, stderr) => {
                console.log(`Killed process ${pid} using port ${port}`);
              });
            });
          }
        });
      } else {
        exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
      }
      // Wait for port to be released
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (err) {
    console.error('Error checking port:', err);
  }
}

async function startServer() {
  try {
    // Check and kill any process using port 3000
    await checkAndKillPort();

    // Prepare Next.js
    await app.prepare();

    // Create custom server
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Add error handling
    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('Port in use, retrying...');
        await checkAndKillPort();
        server.close();
        server.listen(port, hostname);
      } else {
        console.error('Server error:', err);
      }
    });

    // Start listening
    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

startServer(); 