import { type ArgumentMetadata, Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodTypeAny, infer as ZodInfer } from "zod";

/**
 * Validates a request payload against a Zod schema at the trust boundary.
 * On failure the ZodError propagates to the ProblemDetailsFilter, which renders
 * a 422 problem+json with per-field messages.
 */
@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): ZodInfer<T> {
    return this.schema.parse(value);
  }
}
