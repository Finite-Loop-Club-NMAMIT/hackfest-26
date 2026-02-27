import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import db from "~/db";
import { query } from "~/db/data";
import { findById } from "~/db/data/event-users";
import {
  eventAccounts,
  eventSessions,
  eventUsers,
  eventVerificationTokens,
} from "~/db/schema/event-auth";
import { env } from "~/env";
import { auth as pAuth } from "./config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-event.session-token"
          : "event.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  session: {
    strategy: "database",
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
  trustHost: true,
  events: {
    async signIn({ user }) {
      const eventUser = await query.eventUsers.findOne({
        where: (eventUsers, { eq }) => eq(eventUsers.id, user.id ?? ""),
      });
      if (eventUser?.collegeId) return;

      const pSession = await pAuth();
      if (pSession?.user?.id) {
        const participant = await query.participants.findOne({
          where: (participants, { eq }) =>
            eq(participants.id, pSession.user.id),
        });

        await query.eventUsers.update(user.id ?? "", {
          state: participant?.state ?? null,
          gender: participant?.gender ?? null,
          collegeId: participant?.collegeId ?? null,
        });
      } else {
        const existingUser = await query.participants.findOne({
          where: (participants, { eq }) =>
            eq(participants.email, user.email ?? ""),
        });

        if (existingUser) {
          await query.eventUsers.update(user.id ?? "", {
            state: existingUser.state ?? null,
            gender: existingUser.gender ?? null,
            collegeId: existingUser.collegeId ?? null,
          });
        }
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      const pSession = await pAuth();
      if (pSession?.user?.id) {
        if (user.email !== pSession.user.email)
          return "/error?error=email-mismatch";
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes("/error?error=email-mismatch"))
        return `${baseUrl}/events?error=email-mismatch`;

      return `${baseUrl}/events`;
    },
    async session({ session, user }) {
      if (user.id) {
        const eventUser = await findById(user.id);
        if (eventUser) {
          session.eventUser = {
            ...session.user,
            id: user.id,
            collegeId: eventUser.collegeId,
          };
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/events/login",
  },
});
