// ============================================================
// ZOHO SMTP EMAIL SENDER
// ============================================================
// Sends transactional emails from info@move4u.uk via Zoho Mail.
//
// Required environment variables:
//   ZOHO_SMTP_PASSWORD — password (or app-specific password) for
//                        the info@move4u.uk Zoho mailbox.
//
// Optional overrides:
//   ZOHO_SMTP_HOST (default: smtp.zoho.eu)
//   ZOHO_SMTP_PORT (default: 587)
//   ZOHO_SMTP_USER (default: info@move4u.uk)
// ============================================================

import nodemailer from "nodemailer";
import { logger } from "./logger";

const FROM_EMAIL = "info@move4u.uk";
const FROM_NAME  = "Move4U";

function createTransporter() {
  const password = process.env["ZOHO_SMTP_PASSWORD"];
  if (!password) return null;

  const host = process.env["ZOHO_SMTP_HOST"] ?? "smtp.zoho.eu";
  const port = parseInt(process.env["ZOHO_SMTP_PORT"] ?? "587", 10);
  const user = process.env["ZOHO_SMTP_USER"] ?? FROM_EMAIL;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
}

export interface SendEmailOptions {
  to:      string;
  subject: string;
  text:    string;
  replyTo?: string;
}

export async function sendEmail(
  opts: SendEmailOptions,
): Promise<{ sent: boolean; error?: string }> {
  if (!opts.to?.trim()) {
    return { sent: false, error: "No recipient address provided" };
  }

  const transporter = createTransporter();
  if (!transporter) {
    logger.warn(
      "ZOHO_SMTP_PASSWORD is not set — email sending is disabled. " +
      "Add ZOHO_SMTP_PASSWORD to your environment secrets to enable Zoho Mail.",
    );
    return { sent: false, error: "SMTP not configured (ZOHO_SMTP_PASSWORD missing)" };
  }

  try {
    await transporter.sendMail({
      from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
      replyTo: opts.replyTo ?? FROM_EMAIL,
      to:      opts.to,
      subject: opts.subject,
      text:    opts.text,
    });

    logger.info(
      { to: opts.to, subject: opts.subject },
      "Email sent via Zoho SMTP",
    );
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, to: opts.to, subject: opts.subject }, "Zoho SMTP send failed");
    return { sent: false, error: msg };
  }
}
