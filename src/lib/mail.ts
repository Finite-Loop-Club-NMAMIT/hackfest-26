import nodemailer from "nodemailer";

export async function sendAdminPaymentEmail({
  teamName,
  teamId,
  leaderName,
  paymentScreenshotUrl,
  eventName,
}: {
  teamName: string;
  teamId: string;
  leaderName: string;
  paymentScreenshotUrl: string;
  eventName: string;
}) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Missing SMTP credentials. Cannot send admin payment email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: SMTP_USER || '"Hackfest Team" <noreply@hackfest.dev>',
    to: "bn2345890@gmail.com",
    cc: "tech@hackfest.dev",
    subject: `New Side Quest Payment Submission: ${teamName} (${eventName})`,
    html: `
      <h2>New Side Quest Payment Proof</h2>
      <p>A new payment proof has been submitted by a team for a Side Quest registration.</p>

      <h3>Payment Details</h3>
      <ul>
        <li><strong>Side Quest (Event):</strong> ${eventName}</li>
        <li><strong>Team Name:</strong> ${teamName}</li>
        <li><strong>Team ID:</strong> ${teamId}</li>
        <li><strong>Leader Name:</strong> ${leaderName}</li>
      </ul>

      <h3>Screenshot</h3>
      <p>You can view the payment screenshot below or by clicking <a href="${paymentScreenshotUrl}">here</a>.</p>
      <img src="${paymentScreenshotUrl}" alt="Payment Screenshot" style="max-width: 600px; height: auto; border: 1px solid #ccc; margin-top: 10px;" />
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Admin payment notification email sent successfully for team:",
      teamName,
    );
  } catch (emailError) {
    console.error("Failed to send payment email to admin:", emailError);
  }
}

export async function sendPaymentVerifiedEmail({
  to,
  leaderName,
  teamName,
  eventName,
}: {
  to: string;
  leaderName: string;
  teamName: string;
  eventName?: string;
}) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Missing SMTP credentials. Cannot send verification email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const subjectContext = eventName ? `Side Quest (${eventName})` : "Hackathon";

  const mailOptions = {
    from: SMTP_USER || '"Hackfest Team" <noreply@hackfest.dev>',
    to,
    subject: `Payment Verified: ${teamName} for ${subjectContext}`,
    html: `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hackfest'26 Registration Confirmed</title>
</head>

<body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif;">

<!-- Full Background -->
<table width="100%" cellpadding="0" cellspacing="0"
style="background:url('https://res.cloudinary.com/dyrzaaln4/image/upload/v1773935432/underwater_dx6hqv.jpg') no-repeat center/cover;">
<tr>
<td align="center">

<!-- Overlay -->
<table width="100%" cellpadding="0" cellspacing="0"
style="background:linear-gradient(rgba(6,18,40,0.75), rgba(6,18,40,0.85)); padding:60px 20px;">

<tr>
<td align="center">

<!-- Content Container -->
<table width="600" cellpadding="0" cellspacing="0" style="color:#e5e7eb; text-align:center;">

<!-- Logo -->
<tr>
<td style="padding-bottom:20px;">
<img src="https://res.cloudinary.com/dyrzaaln4/image/upload/v1773647531/logo_mmcjr9.jpg"
width="70"
style="border-radius:10px;">
</td>
</tr>

<!-- Title -->
<tr>
<td style="font-size:26px; font-weight:600; color:#ffffff; padding-bottom:10px;">
Hackfest'26
</td>
</tr>

<!-- Subtitle -->
<tr>
<td style="font-size:16px; color:#cbd5f5; padding-bottom:30px;">
Payment Confirmation
</td>
</tr>

<!-- Message -->
<tr>
<td style="font-size:16px; line-height:1.7; padding:0 20px 25px 20px;">

<p style="margin:0 0 15px 0;">
Hi <strong style="color:#ffffff;">${leaderName}</strong>,
</p>

<p style="margin:0 0 15px 0;">
We’re pleased to inform you that the payment for your team,
<strong style="color:#ffffff;">${teamName}</strong>, participating in
<strong style="color:#ffffff;">${subjectContext}</strong>, has been successfully verified.
</p>

<p style="margin:0;">
Your team’s registration is now fully confirmed. We look forward to your participation.
</p>

</td>
</tr>

<!-- Divider -->
<tr>
<td style="padding:25px 0;">
<div style="width:60px; height:1px; background:#94a3b8; margin:0 auto;"></div>
</td>
</tr>

<!-- Closing -->
<tr>
<td style="font-size:14px; color:#cbd5f5; line-height:1.6;">
If you have any questions, feel free to reach out to us.
</td>
</tr>

<tr>
<td style="font-size:13px; color:#9ca3af; padding-top:20px;">
Best regards,<br>
Hackfest Organizing Team
</td>
</tr>

<!-- Footer Logo -->
<tr>
<td style="padding-top:40px;">
<img src="https://res.cloudinary.com/dyrzaaln4/image/upload/v1773647904/Logo_4x-8_fqdjh3.png"
width="100"
style="opacity:0.8;">
</td>
</tr>

</table>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Payment verification email sent successfully to:", to);
  } catch (emailError) {
    console.error("Failed to send payment verification email:", emailError);
  }
}

export async function sendSupportIssueEmail({
  teamName,
  teamNo,
  submitterName,
  description,
  labName,
}: {
  teamName: string;
  teamNo: number | null;
  submitterName: string;
  description: string;
  labName: string | null;
}) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Missing SMTP credentials. Cannot send support issue email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const teamLabel =
    teamNo !== null
      ? `#${String(teamNo).padStart(2, "0")} ${teamName}`
      : teamName;
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const mailOptions = {
    from: SMTP_USER || '"Hackfest Team" <noreply@hackfest.dev>',
    to: "bn2345890@gmail.com",
    subject: `🚨 Support Issue: ${teamLabel}`,
    html: `
      <h2 style="color:#dc2626;">New Support Ticket</h2>
      <p>A participant has reported a technical issue.</p>

      <table style="border-collapse:collapse; margin:16px 0;">
        <tr>
          <td style="padding:6px 12px; font-weight:bold; color:#374151;">Team</td>
          <td style="padding:6px 12px;">${teamLabel}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px; font-weight:bold; color:#374151;">Lab</td>
          <td style="padding:6px 12px;">${labName ?? "Not assigned"}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px; font-weight:bold; color:#374151;">Reported By</td>
          <td style="padding:6px 12px;">${submitterName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px; font-weight:bold; color:#374151;">Time</td>
          <td style="padding:6px 12px;">${timestamp}</td>
        </tr>
      </table>

      <h3 style="color:#374151;">Issue Description</h3>
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px; white-space:pre-wrap; font-size:14px; color:#1f2937;">
${description}
      </div>

      <p style="margin-top:20px; font-size:13px; color:#9ca3af;">
        Please resolve this via the <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://hackfest.dev"}/dashboard">Support Dashboard</a>.
      </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Support issue email sent for team:", teamName);
  } catch (emailError) {
    console.error("Failed to send support issue email:", emailError);
  }
}
