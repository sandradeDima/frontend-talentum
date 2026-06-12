export const BOLIVIA_TIME_ZONE = 'America/La_Paz';

const BOLIVIA_UTC_OFFSET_HOURS = 4;
const DATE_TIME_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const boliviaDateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeZone: BOLIVIA_TIME_ZONE
});

const boliviaDateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: BOLIVIA_TIME_ZONE
});

const boliviaDateInputFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: BOLIVIA_TIME_ZONE
});

const boliviaDateTimeInputFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: BOLIVIA_TIME_ZONE
});

const normalizeDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatToPartsMap = (formatter: Intl.DateTimeFormat, value: Date) => {
  return formatter.formatToParts(value).reduce<Record<string, string>>((parts, item) => {
    if (item.type !== 'literal') {
      parts[item.type] = item.value;
    }

    return parts;
  }, {});
};

export const formatBoliviaDate = (value: string | Date | null | undefined): string => {
  const parsed = normalizeDate(value);
  return parsed ? boliviaDateFormatter.format(parsed) : 'Sin registro';
};

export const formatBoliviaDateTime = (
  value: string | Date | null | undefined
): string => {
  const parsed = normalizeDate(value);
  return parsed ? boliviaDateTimeFormatter.format(parsed) : 'Sin registro';
};

export const toBoliviaDateInputValue = (value: string | Date | null | undefined): string => {
  const parsed = normalizeDate(value);

  if (!parsed) {
    return '';
  }

  const parts = formatToPartsMap(boliviaDateInputFormatter, parsed);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const toBoliviaDateTimeInputValue = (
  value: string | Date | null | undefined
): string => {
  const parsed = normalizeDate(value);

  if (!parsed) {
    return '';
  }

  const parts = formatToPartsMap(boliviaDateTimeInputFormatter, parsed);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const toBoliviaDateTimeIso = (value: string): string | null => {
  const match = value.match(DATE_TIME_INPUT_PATTERN);

  if (!match) {
    return null;
  }

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour + BOLIVIA_UTC_OFFSET_HOURS, minute, 0, 0)
  );

  if (toBoliviaDateTimeInputValue(utcDate) !== value) {
    return null;
  }

  return utcDate.toISOString();
};
