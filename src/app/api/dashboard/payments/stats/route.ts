import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { getPaymentStats } from "~/db/services/payment-services";

export const GET = adminProtected(async (_request: Request) => {
  const stats = await getPaymentStats();
  return NextResponse.json(stats);
});
