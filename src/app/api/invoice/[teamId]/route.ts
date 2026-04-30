import { renderToBuffer } from "@react-pdf/renderer";
import { count, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { InvoicePDF } from "~/components/invoice/invoice-pdf";
import db from "~/db";
import {
  colleges,
  invoice,
  participants,
  payment,
  selected,
  teams,
} from "~/db/schema";
import { env } from "~/env";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  // Fetch teams + leader + payment
  const teamData = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      paymentStatus: teams.paymentStatus,
      leaderId: teams.leaderId,
      paymentId: teams.paymentId,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .then((r) => r[0]);

  const selectedTeam = await db
    .select({ teamNo: selected.teamNo })
    .from(selected)
    .where(eq(selected.teamId, teamId))
    .then((r) => r[0]);

  if (!teamData) {
    return NextResponse.json({ error: "teams not found" }, { status: 404 });
  }

  // Fetch leader details
  const leader = await db
    .select({
      name: participants.name,
      email: participants.email,
      phone: participants.phone,
      collegeId: participants.collegeId,
    })
    .from(participants)
    .where(eq(participants.id, teamData.leaderId))
    .then((r) => r[0]);

  // Fetch colleges name
  let collegeName = "N/A";
  if (leader?.collegeId) {
    const col = await db
      .select({ name: colleges.name })
      .from(colleges)
      .where(eq(colleges.id, leader.collegeId))
      .then((r) => r[0]);
    collegeName = col?.name ?? "N/A";
  }

  // Fetch member count
  const memberCount = await db
    .select({ count: count() })
    .from(participants)
    .where(eq(participants.teamId, teamId))
    .then((r) => r[0].count);

  // Fetch payment details
  let _paymentAmount = "400";
  let transactionId = "N/A";
  let payDate = "N/A";
  if (teamData.paymentId) {
    const pay = await db
      .select({
        amount: payment.amount,
        transactionId: payment.paymentTransactionId,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(eq(payment.id, teamData.paymentId))
      .then((r) => r[0]);
    _paymentAmount = pay?.amount ?? "400";
    transactionId = pay?.transactionId ?? "N/A";
    payDate = pay?.createdAt.toLocaleDateString("en-IN") ?? "N/A";
  }

  let invoiceNo = crypto.randomUUID().split("-")[0].toUpperCase();

  const invoiceDb = await db
    .select({
      no: invoice.invoiceNo,
    })
    .from(invoice)
    .where(eq(invoice.teamId, teamData.teamId))
    .then((r) => r[0]);

  if (invoiceDb) {
    invoiceNo = invoiceDb.no;
  } else {
    await db.insert(invoice).values({
      teamId: teamData.teamId,
      invoiceNo,
      transactionId: transactionId,
    });
  }

  // Auto invoice number from teams name (e.g. "teams 3" → 3)

  const logoUrl =
    "https://res.cloudinary.com/dyrzaaln4/image/upload/v1777371787/WhatsApp_Image_2026-04-28_at_14.59.53_ucmvsm.jpg";
  const nandanSignUrl = env.NANDAN_SIGN_URL;
  const shashankSignUrl = env.SHASHANK_SIGN_URL;

  if (!nandanSignUrl || !shashankSignUrl) {
    throw new Error("Signature URLs are not configured");
  }

  const pdfBuffer = await renderToBuffer(
    InvoicePDF({
      invoiceNo,
      date: payDate,
      teamName: `${teamData.teamName} - #${selectedTeam.teamNo}`,
      leaderName: leader?.name ?? "N/A",
      collegeName,
      phone: leader?.phone ?? "N/A",
      email: leader?.email ?? "N/A",
      memberCount: Number(memberCount),
      unitPrice: 400,
      transactionId,
      shashankSignUrl,
      nandanSignUrl,
      logoUrl,
    }),
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice_${teamData.teamName}.pdf"`,
    },
  });
}
