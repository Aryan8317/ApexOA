const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
console.log("AUTH_GITHUB_ID:", typeof process.env.AUTH_GITHUB_ID, process.env.AUTH_GITHUB_ID);
