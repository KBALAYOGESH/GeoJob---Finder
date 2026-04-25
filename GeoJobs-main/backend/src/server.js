const { createApp } = require('./app');
const { env } = require('./config/env');
const { connectDb } = require('./config/db');
const http = require('http');
const { initSocket } = require('./socket');

async function main() {
  const app = createApp();
  const server = http.createServer(app);

  await connectDb();

  initSocket(server, { corsOrigin: true });

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`GeoJobs backend listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

