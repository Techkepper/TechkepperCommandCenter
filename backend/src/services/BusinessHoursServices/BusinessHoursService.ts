import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import BusinessHoursSpecialDate from "../../models/BusinessHoursSpecialDate";
import Setting from "../../models/Setting";

export const SPECIAL_DATE_TYPES = [
  "holiday",
  "vacation",
  "shutdown",
  "maintenance",
  "custom"
] as const;

const DEFAULT_AFTER_HOURS_MESSAGE = `Hola, gracias por comunicarse con Techkepper Company S.A. 👋

Hemos recibido su mensaje correctamente. Nuestro horario de atención es de lunes a viernes de 9:00 a.m. a 5:00 p.m.

Su solicitud queda registrada y nuestro equipo le dará seguimiento en el próximo horario hábil.`;

const DEFAULT_NON_WORKING_MESSAGE = `Hola, gracias por comunicarse con Techkepper Company S.A. 👋

Actualmente estamos fuera de nuestro horario de atención. Su mensaje fue recibido correctamente y será atendido el próximo día hábil.

Gracias por su comprensión.`;

export const DEFAULT_SPECIAL_DATE_MESSAGE = `Hola, gracias por comunicarse con Techkepper Company S.A. 👋

En este momento nos encontramos en un periodo especial de cierre temporal. Su mensaje fue recibido correctamente y será atendido cuando retomemos operaciones.

Gracias por su comprensión.`;

const SETTING_KEYS = {
  enabled: "afterHoursAutoReplyEnabled",
  timezone: "businessHoursTimezone",
  workingDays: "businessHoursWorkingDays",
  startTime: "businessHoursStartTime",
  endTime: "businessHoursEndTime",
  afterHoursMessage: "afterHoursReplyMessage",
  nonWorkingDayMessage: "nonWorkingDayReplyMessage",
  cooldownHours: "afterHoursReplyCooldownHours"
} as const;

export interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string;
  workingDays: number[];
  startTime: string;
  endTime: string;
  afterHoursMessage: string;
  nonWorkingDayMessage: string;
  cooldownHours: number;
}

export interface BusinessHoursEvaluation {
  replyType: "special_date" | "non_working_day" | "after_hours" | null;
  message: string | null;
  specialDateId?: number;
}

const defaults = (): BusinessHoursConfig => ({
  enabled: process.env.ENABLE_AFTER_HOURS_AUTO_REPLY === "true",
  timezone: process.env.BUSINESS_HOURS_TIMEZONE || "America/Costa_Rica",
  workingDays: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "17:00",
  afterHoursMessage: DEFAULT_AFTER_HOURS_MESSAGE,
  nonWorkingDayMessage: DEFAULT_NON_WORKING_MESSAGE,
  cooldownHours: Math.max(
    1,
    Number(process.env.AFTER_HOURS_REPLY_COOLDOWN_HOURS) || 12
  )
});

const parseWorkingDays = (value: string | undefined): number[] => {
  try {
    const parsed = JSON.parse(value || "[]");
    if (
      Array.isArray(parsed) &&
      parsed.every(day => Number.isInteger(day) && day >= 0 && day <= 6)
    ) {
      return [...new Set(parsed)].sort();
    }
  } catch (_error) {
    // Invalid persisted data falls back to the safe default.
  }
  return defaults().workingDays;
};

const validateTime = (value: string): boolean =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const validateTimezone = (timezone: string): void => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch (_error) {
    throw new AppError("ERR_INVALID_BUSINESS_HOURS_TIMEZONE", 400);
  }
};

export const getBusinessHoursConfig =
  async (): Promise<BusinessHoursConfig> => {
    const fallback = defaults();
    const rows = await Setting.findAll({
      where: { key: { [Op.in]: Object.values(SETTING_KEYS) } }
    });
    const values = new Map(rows.map(row => [row.key, row.value]));
    const timezone = values.get(SETTING_KEYS.timezone) || fallback.timezone;
    validateTimezone(timezone);

    return {
      enabled: values.has(SETTING_KEYS.enabled)
        ? values.get(SETTING_KEYS.enabled) === "true"
        : fallback.enabled,
      timezone,
      workingDays: parseWorkingDays(values.get(SETTING_KEYS.workingDays)),
      startTime: values.get(SETTING_KEYS.startTime) || fallback.startTime,
      endTime: values.get(SETTING_KEYS.endTime) || fallback.endTime,
      afterHoursMessage:
        values.get(SETTING_KEYS.afterHoursMessage) ||
        fallback.afterHoursMessage,
      nonWorkingDayMessage:
        values.get(SETTING_KEYS.nonWorkingDayMessage) ||
        fallback.nonWorkingDayMessage,
      cooldownHours: Math.max(
        1,
        Number(values.get(SETTING_KEYS.cooldownHours)) || fallback.cooldownHours
      )
    };
  };

export const updateBusinessHoursConfig = async (
  input: BusinessHoursConfig
): Promise<BusinessHoursConfig> => {
  const workingDays = [...new Set(input.workingDays || [])]
    .map(Number)
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort();
  const cooldownHours = Number(input.cooldownHours);
  validateTimezone(input.timezone);
  if (
    !validateTime(input.startTime) ||
    !validateTime(input.endTime) ||
    !input.afterHoursMessage?.trim() ||
    !input.nonWorkingDayMessage?.trim() ||
    !Number.isFinite(cooldownHours) ||
    cooldownHours < 1 ||
    cooldownHours > 720
  ) {
    throw new AppError("ERR_INVALID_BUSINESS_HOURS_CONFIG", 400);
  }

  const values: Record<string, string> = {
    [SETTING_KEYS.enabled]: String(Boolean(input.enabled)),
    [SETTING_KEYS.timezone]: input.timezone.trim(),
    [SETTING_KEYS.workingDays]: JSON.stringify(workingDays),
    [SETTING_KEYS.startTime]: input.startTime,
    [SETTING_KEYS.endTime]: input.endTime,
    [SETTING_KEYS.afterHoursMessage]: input.afterHoursMessage.trim(),
    [SETTING_KEYS.nonWorkingDayMessage]: input.nonWorkingDayMessage.trim(),
    [SETTING_KEYS.cooldownHours]: String(cooldownHours)
  };

  await Promise.all(
    Object.entries(values).map(([key, value]) =>
      Setting.upsert({ key, value } as Setting)
    )
  );
  return getBusinessHoursConfig();
};

const localDateTime = (
  date: Date,
  timezone: string
): { date: string; weekday: number; minutes: number } => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short"
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find(part => part.type === type)?.value || "";
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: weekdays[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute"))
  };
};

const timeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const evaluateBusinessHours = async (
  now = new Date()
): Promise<BusinessHoursEvaluation> => {
  const config = await getBusinessHoursConfig();
  if (!config.enabled) return { replyType: null, message: null };

  const local = localDateTime(now, config.timezone);
  const specialDate = await BusinessHoursSpecialDate.findOne({
    where: {
      active: true,
      startDate: { [Op.lte]: local.date },
      endDate: { [Op.gte]: local.date }
    },
    order: [
      ["startDate", "DESC"],
      ["id", "DESC"]
    ]
  });
  if (specialDate) {
    return {
      replyType: "special_date",
      message: specialDate.message,
      specialDateId: specialDate.id
    };
  }

  if (!config.workingDays.includes(local.weekday)) {
    return {
      replyType: "non_working_day",
      message: config.nonWorkingDayMessage
    };
  }

  const start = timeToMinutes(config.startTime);
  const end = timeToMinutes(config.endTime);
  const inside =
    start <= end
      ? local.minutes >= start && local.minutes < end
      : local.minutes >= start || local.minutes < end;
  return inside
    ? { replyType: null, message: null }
    : { replyType: "after_hours", message: config.afterHoursMessage };
};

export const listSpecialDates = (): Promise<BusinessHoursSpecialDate[]> =>
  BusinessHoursSpecialDate.findAll({ order: [["startDate", "DESC"]] });

interface SpecialDateInput {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  message: string;
  active?: boolean;
}

const validateSpecialDate = (input: SpecialDateInput): void => {
  if (
    !input.name?.trim() ||
    !SPECIAL_DATE_TYPES.includes(
      input.type as (typeof SPECIAL_DATE_TYPES)[number]
    ) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate) ||
    input.endDate < input.startDate ||
    !input.message?.trim()
  ) {
    throw new AppError("ERR_INVALID_SPECIAL_DATE", 400);
  }
};

export const createSpecialDate = async (
  input: SpecialDateInput
): Promise<BusinessHoursSpecialDate> => {
  validateSpecialDate(input);
  return BusinessHoursSpecialDate.create({
    ...input,
    name: input.name.trim(),
    message: input.message.trim(),
    active: input.active !== false
  } as BusinessHoursSpecialDate);
};

export const updateSpecialDate = async (
  id: number,
  input: SpecialDateInput
): Promise<BusinessHoursSpecialDate> => {
  validateSpecialDate(input);
  const specialDate = await BusinessHoursSpecialDate.findByPk(id);
  if (!specialDate) throw new AppError("ERR_SPECIAL_DATE_NOT_FOUND", 404);
  await specialDate.update({
    ...input,
    name: input.name.trim(),
    message: input.message.trim()
  });
  return specialDate;
};

export const deleteSpecialDate = async (id: number): Promise<void> => {
  const specialDate = await BusinessHoursSpecialDate.findByPk(id);
  if (!specialDate) throw new AppError("ERR_SPECIAL_DATE_NOT_FOUND", 404);
  await specialDate.destroy();
};
