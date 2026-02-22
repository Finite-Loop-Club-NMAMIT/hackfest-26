import type { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { RateLimiterRedis } from "rate-limiter-flexible";
import { AppError } from "~/lib/errors/app-error";
import { getIdentifier, rateLimiters, withRateLimit } from "~/lib/rate-limit";
import { errorResponse } from "~/lib/response/error";
import { getCurrentEventUser, getCurrentUser } from "./get-current-user";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: Session["user"],
) => Promise<NextResponse>;

type EventUser = NonNullable<Session["eventUser"]>;

type EventRouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: EventUser,
) => Promise<NextResponse>;

export function protectedRoute(
  handler: RouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    const limiter = customRateLimiter || rateLimiters.api;
    const identifier = getIdentifier(request);
    const rateLimitResponse = await withRateLimit(request, limiter, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(
        new AppError("UNAUTHORIZED", 401, {
          title: "Unauthorized",
          description: "You must be logged in to perform this action.",
        }),
      );
    }

    try {
      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function registrationRequiredRoute(
  handler: RouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return protectedRoute(async (request, context, user) => {
    if (!user.isRegistrationComplete) {
      return errorResponse(
        new AppError("REGISTRATION_INCOMPLETE", 403, {
          title: "Registration incomplete",
          description:
            "Please complete your registration before accessing this resource.",
        }),
      );
    }

    try {
      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  }, customRateLimiter);
}

export function protectedEventRoute(
  handler: EventRouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const limiter = customRateLimiter || rateLimiters.api;
      const identifier = getIdentifier(request);
      const rateLimitResponse = await withRateLimit(
        request,
        limiter,
        identifier,
      );
      if (rateLimitResponse) return rateLimitResponse;

      const user = await getCurrentEventUser();

      if (!user) {
        return errorResponse(
          new AppError("UNAUTHORIZED", 401, {
            title: "Unauthorized",
            description: "You must be logged in to perform this action.",
          }),
        );
      }

      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function publicRoute(
  handler: (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => Promise<NextResponse>,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      // try ip based cuz no user on public routes
      const limiter = customRateLimiter || rateLimiters.api;
      const identifier = getIdentifier(request);
      const rateLimitResponse = await withRateLimit(
        request,
        limiter,
        identifier,
      );
      if (rateLimitResponse) return rateLimitResponse;

      return await handler(request, context);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
