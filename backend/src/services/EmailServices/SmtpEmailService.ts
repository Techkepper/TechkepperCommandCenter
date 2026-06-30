import nodemailer from "nodemailer";
import AppError from "../../errors/AppError";

interface SendEmailRequest {
  to: string[];
  subject: string;
  text: string;
}

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || 0),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || ""
});

const SmtpEmailService = async ({
  to,
  subject,
  text
}: SendEmailRequest): Promise<void> => {
  const config = getSmtpConfig();
  if (
    !config.host ||
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535 ||
    !config.user ||
    !config.pass ||
    !config.from
  ) {
    throw new AppError("ERR_SMTP_NOT_CONFIGURED", 503);
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text
  });
};

export default SmtpEmailService;
