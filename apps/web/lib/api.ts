import { createApiClient } from "@stayboost/api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** The shared, typed API client for browser-side calls. */
export const api = createApiClient({ baseUrl });
