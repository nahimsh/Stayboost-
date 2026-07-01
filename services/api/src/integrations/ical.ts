// Re-export the shared iCal parser that now lives in @stayboost/domain so both
// the API (IcalConnector) and the background workers can use the same logic.
export type { IcalEvent } from "@stayboost/domain";
export { parseIcal, normalizeEvent, reservationsFromIcal } from "@stayboost/domain";
