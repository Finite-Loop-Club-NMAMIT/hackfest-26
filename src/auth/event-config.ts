import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import NextAuth, { DefaultSession } from "next-auth";
import db from "~/db";
import { env } from "~/env";
import {
  eventSessions,
  eventAccounts,
  eventUsers,
  eventVerificationTokens,
} from "~/db/schema/event-auth";
import { query } from "~/db/data";
import { eq } from "drizzle-orm";

// Separate key for eventUsers
declare module "next-auth" {
  interface Session extends DefaultSession {
    eventUser: DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  basePath: "/api/auth/event",
  adapter: DrizzleAdapter(db, {
    usersTable: eventUsers,
    accountsTable: eventAccounts,
    sessionsTable: eventSessions,
    verificationTokensTable: eventVerificationTokens,
  }),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // HACK: token.sub is equal to userId
        token.eventUserId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.eventUserId) {
        const user = await query.eventUsers.findOne({
          where: eq(eventUsers.id, token.eventUserId as string),
        });
        if (user) {
          session.eventUser = user;
        }
      }
      return session;
    },
  },
});
