import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodError } from "zod";

/** RFC-7807 problem+json body. */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ReadonlyArray<{ field: string; message: string }>;
}

/**
 * Translates every thrown error into a consistent `application/problem+json`
 * response. Never leaks stack traces to clients; logs server-side with context.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Http");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem = this.toProblem(exception, request.url);

    if (problem.status >= 500) {
      this.logger.error(`${request.method} ${request.url} -> ${problem.status}`, exception);
    }

    response
      .status(problem.status)
      .setHeader("Content-Type", "application/problem+json")
      .json(problem);
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    if (exception instanceof ZodError) {
      return {
        type: "https://stayboost.com/problems/validation",
        title: "Validation failed",
        status: 422,
        detail: "One or more fields are invalid.",
        instance,
        errors: exception.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const detail =
        typeof res === "string"
          ? res
          : ((res as { message?: string | string[] }).message ?? exception.message);
      return {
        type: "about:blank",
        title: exception.name.replace(/Exception$/, ""),
        status,
        detail: Array.isArray(detail) ? detail.join(", ") : detail,
        instance,
      };
    }

    return {
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      instance,
    };
  }
}
