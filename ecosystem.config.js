module.exports = {
  apps: [
    {
      name: "jurisbot",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/jurisbot",
      node_args: "--max-old-space-size=2048",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1800M",
    },
  ],
};
