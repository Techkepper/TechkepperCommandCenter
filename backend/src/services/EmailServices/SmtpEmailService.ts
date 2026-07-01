import nodemailer from "nodemailer";
import AppError from "../../errors/AppError";

interface SendEmailRequest {
  to: string[];
  subject: string;
  text: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface ResolvedSmtpFrom {
  name: string;
  address: string;
  display: string;
  source: "SMTP_FROM" | "SMTP_USER";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const extractEmail = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const bracketMatch = trimmed.match(/<([^>]+)>/);
  if (bracketMatch) {
    const candidate = bracketMatch[1].trim();
    return EMAIL_PATTERN.test(candidate) ? candidate : null;
  }

  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
};

const extractDisplayName = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const bracketMatch = trimmed.match(/^(.*?)\s*<[^>]+>\s*$/);
  if (bracketMatch) {
    const name = bracketMatch[1].replace(/^["']|["']$/g, "").trim();
    return name || fallback;
  }

  return EMAIL_PATTERN.test(trimmed) ? fallback : trimmed;
};

export const resolveSmtpFrom = (): ResolvedSmtpFrom | null => {
  const smtpFrom = (process.env.SMTP_FROM || "").trim();
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const fromSmtpFrom = extractEmail(smtpFrom);
  const fromSmtpUser = extractEmail(smtpUser);

  const address = fromSmtpFrom || fromSmtpUser;
  if (!address) {
    return null;
  }

  const name = smtpFrom
    ? extractDisplayName(smtpFrom, smtpUser || "Techkepper")
    : smtpUser || "Techkepper";

  return {
    name,
    address,
    display: `${name} <${address}>`,
    source: fromSmtpFrom ? "SMTP_FROM" : "SMTP_USER"
  };
};

const getSmtpConfig = (): SmtpConfig => ({
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || 0),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || ""
});

export const getSmtpStatus = (): {
  configured: boolean;
  from: string | null;
  fromSource: ResolvedSmtpFrom["source"] | null;
  warning: string | null;
} => {
  const config = getSmtpConfig();
  const resolvedFrom = resolveSmtpFrom();
  const configured = Boolean(
    config.host &&
      Number.isInteger(config.port) &&
      config.port >= 1 &&
      config.port <= 65535 &&
      config.user &&
      config.pass &&
      resolvedFrom
  );

  let warning: string | null = null;
  if (configured && resolvedFrom && resolvedFrom.source === "SMTP_USER") {
    const smtpFromRaw = (process.env.SMTP_FROM || "").trim();
    if (smtpFromRaw && !extractEmail(smtpFromRaw)) {
      warning = `Nombre visible: "${smtpFromRaw}". Correo remitente: ${resolvedFrom.address} (SMTP_USER).`;
    }
  } else if (config.host && config.user && config.pass && !resolvedFrom) {
    warning =
      "Falta SMTP_USER con un correo válido, o SMTP_FROM con formato correo@dominio.com.";
  } else if (!config.host || !config.user || !config.pass) {
    warning =
      "SMTP incompleto. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM.";
  }

  return {
    configured,
    from: configured && resolvedFrom ? resolvedFrom.display : null,
    fromSource: configured && resolvedFrom ? resolvedFrom.source : null,
    warning
  };
};

const SmtpEmailService = async ({
  to,
  subject,
  text
}: SendEmailRequest): Promise<void> => {
  const config = getSmtpConfig();
  const resolvedFrom = resolveSmtpFrom();

  if (
    !config.host ||
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535 ||
    !config.user ||
    !config.pass ||
    !resolvedFrom
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

  try {
    await transporter.sendMail({
      from: {
        name: resolvedFrom.name,
        address: resolvedFrom.address
      },
      to,
      subject,
      text
    });
  } catch (error) {
    const smtpMessage =
      error instanceof Error ? error.message : "Unknown SMTP error";
    throw new AppError(`ERR_SMTP_SEND_FAILED: ${smtpMessage}`, 502);
  }
};

export default SmtpEmailService;
