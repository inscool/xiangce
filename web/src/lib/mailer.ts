import nodemailer from "nodemailer";

import { getSystemSetting } from "@/lib/system-settings";

type VerificationMailInput = {
  email: string;
  username: string;
  verificationLink: string;
};

type InquiryNotificationInput = {
  ownerUsername: string;
  inquiry: {
    name: string | null;
    email: string;
    whatsapp: string | null;
    message: string;
    createdAt: Date;
  };
  adminEmails: string[];
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

async function getSmtpConfig(): Promise<SmtpConfig> {
  const saved = await getSystemSetting<{
    host?: string;
    port?: string;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  }>("smtp");

  const host = saved?.host?.trim() || process.env.SMTP_HOST;
  const user = saved?.user?.trim() || process.env.SMTP_USER;
  const pass = saved?.pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP configuration. Set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  const port = Number(saved?.port || process.env.SMTP_PORT || "587");
  const secure = saved?.secure ?? process.env.SMTP_SECURE === "true" || port === 465;
  const from = saved?.from?.trim() || process.env.SMTP_FROM || user;

  return { host, port, secure, user, pass, from };
}

export async function sendVerificationEmail(input: VerificationMailInput) {
  const config = await getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to: input.email,
    subject: "Verify your Photo Album account",
    text: `Hi ${input.username}, please verify your account by opening this link: ${input.verificationLink}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>Welcome, ${input.username}</h2><p>Please verify your account to activate login:</p><p><a href="${input.verificationLink}">Verify Email</a></p><p>This link expires in 24 hours.</p></div>`,
  });
}

export async function sendInquiryNotificationEmail(input: InquiryNotificationInput) {
  if (!input.adminEmails.length) {
    return;
  }

  const config = await getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const subject = `[Xiangce] New inquiry for @${input.ownerUsername}`;
  const safeName = input.inquiry.name || "(not provided)";
  const safeWhatsapp = input.inquiry.whatsapp || "(not provided)";

  await transporter.sendMail({
    from: config.from,
    to: input.adminEmails,
    subject,
    text: [
      `A new inquiry has been submitted to @${input.ownerUsername}.`,
      `Name: ${safeName}`,
      `Email: ${input.inquiry.email}`,
      `WhatsApp: ${safeWhatsapp}`,
      "Message:",
      input.inquiry.message,
      `Submitted at: ${input.inquiry.createdAt.toISOString()}`,
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>New Inquiry for @${input.ownerUsername}</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${input.inquiry.email}</p>
      <p><strong>WhatsApp:</strong> ${safeWhatsapp}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${input.inquiry.message}</p>
      <p><strong>Submitted at:</strong> ${input.inquiry.createdAt.toISOString()}</p>
    </div>`,
  });
}
