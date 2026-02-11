import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const demoUser = {
  email: process.env.DEMO_EMAIL || "demo@mustangmaxx.com",
  password: process.env.DEMO_PASSWORD || "demo123456",
  name: "Demo Agent",
  image: "/mustang-maxx-images/ChatGPT Image Jun 19, 2025, 01_01_40 PM.png",
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "demo",
      name: "Demo Agent",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@mustangmaxx.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === demoUser.email &&
          credentials?.password === demoUser.password
        ) {
          return {
            id: "1",
            email: demoUser.email,
            name: demoUser.name,
            image: demoUser.image,
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.image = user.image
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.image = token.image as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "mustang-maxx-secret",
}
