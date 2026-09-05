// Node is single-threaded per process — without this, the API only ever
// uses one CPU core no matter how big the server is. PM2 cluster mode runs
// one worker per core, all sharing port 5000 via round-robin, with zero
// code changes needed (the app is already stateless: JWT auth, no in-memory
// sessions). This is one of the highest-value, lowest-effort scaling steps
// available before you need multiple servers at all.
//
// Usage:
//   npm install -g pm2
//   pm2 start ecosystem.config.js --env production
//   pm2 status / pm2 logs / pm2 monit
module.exports = {
  apps: [
    {
      name: 'plumbpro-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 'max', // one worker per CPU core
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
  ],
};
