import nodemailer from "nodemailer";

type VerificationMailInput = {
  email: string;
  username: string;
  verificationLink: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP configuration. Set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return { host, port, secure, user, pass };
}

export async function sendVerificationEmail(input: VerificationMailInput) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const from = process.env.SMTP_FROM ?? config.user;

  await transporter.sendMail({
    from,
    to: input.email,
    subject: "Verify your Photo Album account",
    text: `Hi ${input.username}, please verify your account by opening this link: ${input.verificationLink}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>Welcome, ${input.username}</h2><p>Please verify your account to activate login:</p><p><a href="${input.verificationLink}">Verify Email</a></p><p>This link expires in 24 hours.</p></div>`,
  });
}
