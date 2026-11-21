import pino from "pino";

export function createLogger(nodeEnv: string): pino.Logger {
  return pino({
    level: nodeEnv === "test" ? "silent" : "info",
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "password", "token", "code", "*.token", "*.code"],
      censor: "[REDACTED]",
    },
  });
}
