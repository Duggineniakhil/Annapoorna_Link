import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { Logger } from "pino";
import { AppError, toErrorBody } from "../errors.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(toErrorBody("NOT_FOUND"));
}

export function createErrorHandler(logger: Logger) {
  // Express identifies error handlers by arity, so all four parameters are required.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ ...toErrorBody(err.errorCode), ...err.extra });
      return;
    }
    if (err instanceof ZodError) {
      res.status(400).json(toErrorBody("VALIDATION_FAILED"));
      return;
    }
    const e = err as { type?: string; name?: string; status?: number };
    const clientInput =
      e?.type === "entity.parse.failed" ||
      e?.type === "entity.too.large" ||
      e?.type === "charset.unsupported" ||
      e?.name === "MulterError" ||
      e?.status === 413;
    if (clientInput) {
      res.status(400).json(toErrorBody("VALIDATION_FAILED"));
      return;
    }
    logger.error(
      { request_id: res.locals.requestId, method: req.method, route: req.route?.path, err_name: e?.name },
      "unhandled error",
    );
    res.status(500).json(toErrorBody("INTERNAL_ERROR"));
  };
}

