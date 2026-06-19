import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import NextAuth from "next-auth";
import authConfig from "./src/auth.config";
import { db } from "./src/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";

console.log("GITHUB_ID:", process.env.GITHUB_ID);

try {
  const auth = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
  });
  console.log("NextAuth initialized successfully!");
} catch (e) {
  console.error("NextAuth Initialization Error:", e);
}
