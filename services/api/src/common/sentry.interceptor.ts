import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from "@nestjs/common";
import { HttpException, HttpStatus } from "@nestjs/common";
import type { Request } from "express";
import { type Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import * as Sentry from "@sentry/node";
import type { AuthenticatedUser } from "../auth/decorators";

/**
 * Captures 5xx exceptions to Sentry with safe request context.
 *
 * 4xx errors are intentionally skipped — they are client/user errors, not bugs.
 * PII rule: only the anonymous user ID is attached; email and name are never sent.
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((exception: unknown) => {
        const httpStatus =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        if (httpStatus >= 500) {
          const request = context
            .switchToHttp()
            .getRequest<Request & { user?: AuthenticatedUser }>();

          Sentry.withScope((scope) => {
            scope.setTag("method", request.method);
            // pathname only — query strings can contain search terms or tokens
            scope.setTag("path", request.path);
            // User ID is not PII; email/name are and must not be sent
            if (request.user?.id) {
              scope.setUser({ id: request.user.id });
            }
            Sentry.captureException(exception);
          });
        }

        return throwError(() => exception);
      }),
    );
  }
}
