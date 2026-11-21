// Every error_code the app can get (server doc 12 / server/src/errors.ts, plus the mock's own),
// with an English and Telugu message. Used when a response has no message of its own, so the
// UI never shows a raw code or English-only text.

export type ErrorText = { en: string; te: string };

export const ERROR_MESSAGES: Record<string, ErrorText> = {
  VALIDATION_FAILED: {
    en: "The information sent is not valid. Please check and try again.",
    te: "పంపిన సమాచారం సరైనది కాదు. దయచేసి తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  },
  UNAUTHORIZED: {
    en: "Please sign in to continue.",
    te: "కొనసాగించడానికి దయచేసి సైన్ ఇన్ చేయండి.",
  },
  FORBIDDEN: { en: "You do not have access to this.", te: "దీనికి మీకు అనుమతి లేదు." },
  FORBIDDEN_VOLUNTEER: {
    en: "Only volunteers can do this.",
    te: "ఇది వాలంటీర్లు మాత్రమే చేయగలరు.",
  },
  NOT_FOUND: {
    en: "We could not find what you asked for.",
    te: "మీరు అడిగినది మాకు దొరకలేదు.",
  },
  INVALID_STATE: {
    en: "This action is not possible right now.",
    te: "ఈ పని ఇప్పుడు చేయడం సాధ్యం కాదు.",
  },
  INVALID_RANGE: { en: "Check the dates.", te: "తేదీలను తనిఖీ చేయండి." },
  PICKUP_BY_TOO_LATE: {
    en: "The pickup-by time is too late for this food. Choose an earlier time.",
    te: "ఈ ఆహారానికి పికప్ సమయం చాలా ఆలస్యం. ముందు సమయం ఎంచుకోండి.",
  },
  PICKUP_IN_PAST: {
    en: "The pickup time has already passed. Choose a later time.",
    te: "పికప్ సమయం ఇప్పటికే దాటిపోయింది. తర్వాతి సమయం ఎంచుకోండి.",
  },
  WRONG_CODE: {
    en: "The code is wrong. Please check and try again.",
    te: "కోడ్ తప్పు. దయచేసి తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  },
  CODE_LOCKED: {
    en: "Too many wrong tries. Ask the other person to confirm the code.",
    te: "చాలా తప్పు ప్రయత్నాలు. కోడ్ నిర్ధారించమని ఇతరులను అడగండి.",
  },
  RATE_LIMITED: {
    en: "Too many requests. Please wait a few minutes.",
    te: "చాలా ఎక్కువ అభ్యర్థనలు. దయచేసి కొన్ని నిమిషాలు ఆగండి.",
  },
  SERVER_BUSY: {
    en: "The service is busy. Please try again shortly.",
    te: "సేవ బిజీగా ఉంది. కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
  },
  INTERNAL_ERROR: {
    en: "Something went wrong on our side. Please try again.",
    te: "మా వైపు ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
  },
  NETWORK_ERROR: {
    en: "No connection. Check your internet and try again.",
    te: "ఇంటర్నెట్ కనెక్షన్ లేదు. తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  },
  OFFER_EXPIRED: {
    en: "This offer has expired.",
    te: "ఈ ఆఫర్ గడువు ముగిసింది.",
  },
  OFFER_NOT_OPEN: {
    en: "This offer is no longer open.",
    te: "ఈ ఆఫర్ ఇప్పుడు అందుబాటులో లేదు.",
  },
  TASK_NOT_FOUND: {
    en: "This task is no longer available.",
    te: "ఈ పని ఇప్పుడు అందుబాటులో లేదు.",
  },
  TASK_NOT_OPEN: {
    en: "Another volunteer has taken this task.",
    te: "ఈ పనిని మరో వాలంటీర్ తీసుకున్నారు.",
  },
  TASK_ALREADY_ACTIVE: {
    en: "Finish your current task before taking another.",
    te: "మరో పని తీసుకునే ముందు ప్రస్తుత పనిని పూర్తి చేయండి.",
  },
  TASK_NOT_ACCEPTED: {
    en: "Accept the task before picking up.",
    te: "పికప్ చేసే ముందు పనిని అంగీకరించండి.",
  },
  TASK_NOT_PICKED_UP: {
    en: "Pick up the food before delivering.",
    te: "డెలివరీ చేసే ముందు ఆహారాన్ని తీసుకోండి.",
  },
  VOLUNTEER_UNAVAILABLE: {
    en: "Turn on availability to take tasks.",
    te: "పనులు తీసుకోవడానికి అందుబాటును ఆన్ చేయండి.",
  },
  INVALID_AVAILABILITY_INPUT: {
    en: "Could not change your availability. Please try again.",
    te: "మీ అందుబాటును మార్చలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి.",
  },
  INVALID_DELIVERY_INPUT: {
    en: "Check the number of meals delivered.",
    te: "అందించిన భోజనాల సంఖ్యను తనిఖీ చేయండి.",
  },
  STT_EMPTY: {
    en: "We could not hear anything. Hold the button and speak clearly.",
    te: "మాకు ఏమీ వినిపించలేదు. బటన్‌ను నొక్కి పట్టుకుని స్పష్టంగా మాట్లాడండి.",
  },
};

export const GENERIC_ERROR: ErrorText = {
  en: "Something went wrong. Please try again.",
  te: "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
};

/** The message for a code; unknown codes get the generic message. */
export function errorText(code: string | undefined): ErrorText {
  return (code && ERROR_MESSAGES[code]) || GENERIC_ERROR;
}
