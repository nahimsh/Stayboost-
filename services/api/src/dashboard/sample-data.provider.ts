import { Injectable } from "@nestjs/common";
import {
  buildSampleDashboardSnapshot,
  type DashboardSnapshot,
  type SampleDashboardContext,
} from "@stayboost/domain";

/** @deprecated Use {@link SampleDashboardContext} from `@stayboost/domain`. */
export type DashboardContext = SampleDashboardContext;

/**
 * Thin DI wrapper around the shared sample-snapshot builder in
 * `@stayboost/domain` (single source of truth, also used by the public `/demo`
 * page). The builder is the seam the real Reservations / Revenue / Reviews
 * modules replace; the API contract stays unchanged when live data lands.
 */
@Injectable()
export class SampleDashboardProvider {
  build(ctx: SampleDashboardContext = {}): DashboardSnapshot {
    return buildSampleDashboardSnapshot(ctx);
  }
}
