const DIAL_CODES_3 = new Set([
  "971","966","965","974","973","968","964","962","961","963","967","970","972",
  "234","233","212","216","213","218","249","251","254","255","256","237","221",
  "225","252","380","351","353","358","359","385","381","420","880","977","852",
  "886","593","502","504","503","506","507",
]);

const DIAL_CODES_2 = new Set([
  "44","61","49","33","91","81","86","55","52","82","39","34","20","27","92",
  "90","62","63","84","66","60","65","64","46","47","45","31","32","41","43",
  "48","30","40","36","98","95","94","93","58","56","57","51","54","53",
]);

const DIAL_CODES_1 = new Set(["1","7"]);

const MIN_LOCAL_DIGITS = 6;

export function isValidInternationalPhone(digits: string): boolean {
  if (!digits || digits.length < MIN_LOCAL_DIGITS + 1) return false;

  if (digits.length >= 3 + MIN_LOCAL_DIGITS) {
    const prefix3 = digits.slice(0, 3);
    if (DIAL_CODES_3.has(prefix3)) {
      return digits.length - 3 >= MIN_LOCAL_DIGITS;
    }
  }

  if (digits.length >= 2 + MIN_LOCAL_DIGITS) {
    const prefix2 = digits.slice(0, 2);
    if (DIAL_CODES_2.has(prefix2)) {
      return digits.length - 2 >= MIN_LOCAL_DIGITS;
    }
  }

  if (digits.length >= 1 + MIN_LOCAL_DIGITS) {
    const prefix1 = digits.slice(0, 1);
    if (DIAL_CODES_1.has(prefix1)) {
      return digits.length - 1 >= MIN_LOCAL_DIGITS;
    }
  }

  return false;
}
