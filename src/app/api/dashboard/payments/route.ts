import { NextResponse } from "next/server";
import { auth } from "~/auth/dashboard-config";
import { getPayments } from "~/db/services/payment-services";
import { isAdmin } from "~/lib/auth/check-access";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.dashboardUser || !isAdmin(session.dashboardUser)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status") as
    | "Pending"
    | "Paid"
    | "Refunded"
    | undefined;
  const search = searchParams.get("search") ?? undefined;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const result = await getPayments({
    page,
    limit,
    status: status || undefined,
    search: search || undefined,
    sortOrder,
  });

  return NextResponse.json(result);
}
