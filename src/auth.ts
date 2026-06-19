import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  debug: true,
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Demo Account",
      credentials: {},
      async authorize() {
        try {
          // Find or create demo user in PostgreSQL database
          let user = await db.user.findUnique({
            where: { email: "demo@apexoa.com" }
          });
          
          if (!user) {
            user = await db.user.create({
              data: {
                name: "Demo User",
                email: "demo@apexoa.com",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAW3JO5oXkpGv-jU3Wz2sJxQp6wxSnC09o5mbjCWZKSN4d0mKr_DGU7V7KnFOzbH3ERoTxUkGtUe8ErLlUKB2zIvVGlZcpln4x0muQ0wi5hzwhFwwB1HtiHd0MCooAnRDfaNCseaMfKEwT6VhLVTZ4t1LlI4vJfvCzxFjImCV1oi1NwP29gQt0J-iG_lGledSbSnciB2mg023bt4CW6NhkkUamRO0WPiJ5vcLOr4e5ojk_SxH2C8YsaPsVM8vxPiDYADRWNDkNUck-n",
              }
            });
          }
          return user;
        } catch (e) {
          console.error("Credentials authorize DB error:", e);
          return null;
        }
      }
    })
  ]
})
