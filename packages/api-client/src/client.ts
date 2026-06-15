import type { ContactLeadInput, GrowthReport, PropertyProfileInput } from "@stayboost/domain";
import { errorFromResponse } from "./errors";

export interface ApiClientOptions {
  readonly baseUrl: string;
  /** Injectable for tests / SSR; defaults to the global fetch. */
  readonly fetch?: typeof fetch;
}

export interface ContactResponse {
  readonly id: string | null;
  readonly accepted: true;
}

export interface AnalyzerResult {
  readonly token: string;
  readonly report: GrowthReport;
}

export interface ApiClient {
  readonly contact: {
    submit(input: ContactLeadInput): Promise<ContactResponse>;
  };
  readonly analyzer: {
    run(input: PropertyProfileInput): Promise<AnalyzerResult>;
    getReport(token: string): Promise<AnalyzerResult>;
  };
}

export function createApiClient({ baseUrl, fetch: fetchImpl }: ApiClientOptions): ApiClient {
  const doFetch = fetchImpl ?? globalThis.fetch;
  const url = (path: string): string => `${baseUrl.replace(/\/$/, "")}${path}`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await doFetch(url(path), init);
    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    return (await response.json()) as T;
  }

  function post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  return {
    contact: {
      submit: (input) => post<ContactResponse>("/v1/contact", input),
    },
    analyzer: {
      run: (input) => post<AnalyzerResult>("/v1/analyzer/run", input),
      getReport: (token) =>
        request<AnalyzerResult>(`/v1/analyzer/reports/${encodeURIComponent(token)}`),
    },
  };
}
