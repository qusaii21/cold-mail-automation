import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

// nodemailer needs the Node.js runtime, not the Edge runtime.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, text, accessCode } = body as {
      to?: string;
      subject?: string;
      text?: string;
      accessCode?: string;
    };

    // --- Auth: require the shared access code set in Vercel env vars ---
    // This stops random visitors to the deployed URL from sending mail
    // through your Gmail account. Set APP_ACCESS_CODE in Vercel, and
    // enter the same value once in the app's Settings panel.
    const expectedCode = process.env.APP_ACCESS_CODE;
    if (expectedCode && accessCode !== expectedCode) {
      return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
    }

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, text." },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: "Server is not configured: GMAIL_USER / GMAIL_APP_PASSWORD env vars are missing." },
        { status: 500 }
      );
    }

    // --- Attach the resume bundled in /public/resume.pdf ---
    const resumePath = path.join(process.cwd(), "public", "resume.pdf");
    const attachments = [];
    if (fs.existsSync(resumePath)) {
      attachments.push({
        filename: "resume.pdf",
        content: fs.readFileSync(resumePath),
        contentType: "application/pdf",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    await transporter.sendMail({
      from: gmailUser,
      to,
      subject,
      text,
      attachments,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error while sending." },
      { status: 500 }
    );
  }
}
