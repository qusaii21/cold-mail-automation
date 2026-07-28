import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

// nodemailer needs the Node.js runtime, not the Edge runtime.
export const runtime = "nodejs";

// Turns **bold** markers into real HTML <strong> tags, escapes the rest,
// and preserves line breaks. This is what actually makes text bold in an
// email client -- plain-text emails have no concept of markdown, so the
// literal "**" characters show up unless we convert to HTML.
function renderBodyHtml(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return bolded.replace(/\n/g, "<br>");
}

// Plain-text fallback for clients that don't render HTML: just strip the
// ** markers instead of showing them literally.
function renderBodyPlainText(raw: string): string {
  return raw.replace(/\*\*(.+?)\*\*/g, "$1");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      subject,
      text,
      accessCode,
      resumeBase64,
      resumeFilename,
    } = body as {
      to?: string;
      subject?: string;
      text?: string;
      accessCode?: string;
      resumeBase64?: string; // optional, data-URL or raw base64 of a replacement resume
      resumeFilename?: string;
    };

    // --- Auth: require the shared access code set in Vercel env vars ---
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

    // --- Attachment: use a one-off resume sent in the request if provided,
    // otherwise fall back to the resume bundled in /public/resume.pdf.
    // The uploaded resume is never written to disk -- it only exists in
    // memory for the duration of this request.
    const attachments: {
      filename: string;
      content: Buffer;
      contentType: string;
    }[] = [];

    if (resumeBase64) {
      // Strip a "data:application/pdf;base64," prefix if present.
      const base64Data = resumeBase64.includes(",")
        ? resumeBase64.split(",")[1]
        : resumeBase64;
      attachments.push({
        filename: resumeFilename || "resume.pdf",
        content: Buffer.from(base64Data, "base64"),
        contentType: "application/pdf",
      });
    } else {
      const resumePath = path.join(process.cwd(), "public", "Qusai_Shergardwala.pdf");
      if (fs.existsSync(resumePath)) {
        attachments.push({
          filename: "resume.pdf",
          content: fs.readFileSync(resumePath),
          contentType: "application/pdf",
        });
      }
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
      text: renderBodyPlainText(text),
      html: renderBodyHtml(text),
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
