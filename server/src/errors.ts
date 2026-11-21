export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "PICKUP_BY_TOO_LATE"
  | "WRONG_CODE"
  | "CODE_LOCKED"
  | "RATE_LIMITED"
  | "SERVER_BUSY"
  | "INTERNAL_ERROR";

export interface ErrorEntry {
  status: number;
  message: string;
  message_te: string;
}

export const ERROR_CATALOGUE: Record<ErrorCode, ErrorEntry> = {
  VALIDATION_FAILED: { status: 400, message: "The information sent is not valid. Please check and try again.", message_te: "పంపిన సమాచారం సరైనది కాదు. దయచేసి తనిఖీ చేసి మళ్లీ ప్రయత్నించండి." },
  UNAUTHORIZED: { status: 401, message: "Please sign in to continue.", message_te: "కొనసాగించడానికి దయచేసి సైన్ ఇన్ చేయండి." },
  FORBIDDEN: { status: 403, message: "You do not have access to this.", message_te: "దీనికి మీకు అనుమతి లేదు." },
  NOT_FOUND: { status: 404, message: "We could not find what you asked for.", message_te: "మీరు అడిగినది మాకు దొరకలేదు." },
  INVALID_STATE: { status: 409, message: "This action is not possible right now.", message_te: "ఈ పని ఇప్పుడు చేయడం సాధ్యం కాదు." },
  PICKUP_BY_TOO_LATE: { status: 422, message: "The pickup-by time is too late for this food. Choose an earlier time.", message_te: "ఈ ఆహారానికి పికప్ సమయం చాలా ఆలస్యం. ముందు సమయం ఎంచుకోండి." },
  WRONG_CODE: { status: 422, message: "The code is wrong. Please check and try again.", message_te: "కోడ్ తప్పు. దయచేసి తనిఖీ చేసి మళ్లీ ప్రయత్నించండి." },
  CODE_LOCKED: { status: 423, message: "Too many wrong tries. Ask the other person to confirm the code.", message_te: "చాలా తప్పు ప్రయత్నాలు. కోడ్ నిర్ధారించమని ఇతరులను అడగండి." },
  RATE_LIMITED: { status: 429, message: "Too many requests. Please wait a few minutes.", message_te: "చాలా ఎక్కువ అభ్యర్థనలు. దయచేసి కొన్ని నిమిషాలు ఆగండి." },
  SERVER_BUSY: { status: 503, message: "The service is busy. Please try again shortly.", message_te: "సేవ బిజీగా ఉంది. కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి." },
  INTERNAL_ERROR: { status: 500, message: "Something went wrong on our side. Please try again.", message_te: "మా వైపు ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి." },
};

export interface ErrorBody {
  error_code: ErrorCode;
  message: string;
  message_te: string;
}

export function toErrorBody(code: ErrorCode): ErrorBody {
  const entry = ERROR_CATALOGUE[code];
  return { error_code: code, message: entry.message, message_te: entry.message_te };
}

export class AppError extends Error {
  readonly errorCode: ErrorCode;
  readonly statusCode: number;
  readonly extra: Record<string, number>;

  constructor(errorCode: ErrorCode, extra: Record<string, number> = {}) {
    super(errorCode);
    this.extra = extra;
    this.name = "AppError";
    this.errorCode = errorCode;
    this.statusCode = ERROR_CATALOGUE[errorCode].status;
  }
}
