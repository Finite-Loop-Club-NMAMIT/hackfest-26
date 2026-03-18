import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { listEvaluatorAccessRoles } from "~/db/services/submission-services";
import { errorResponse } from "~/lib/response/error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = adminProtected(async () => {
  try {
    const data = await listEvaluatorAccessRoles();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
