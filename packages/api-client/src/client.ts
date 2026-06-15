import type { ContactLeadInput } from "@stayboost/domain";
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

export interface ApiClient {
  readonly contact: {
    submit(input: ContactLeadInput): Promise<ContactResponse>;
  };
}

export function createApiClient({ baseUrl, fetch: fetchImpl }: ApiClientOptions): ApiClient {
  const doFetch = fetchImpl ?? globalThis.fetch;
  const url = (path: string): string => `${baseUrl.replace(/\/$/, "")}${path}`;

  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await doFetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    return (await response.json()) as T;
  }

  return {
    contact: {
      submit: (input) => post<ContactResponse>("/v1/contact", input),
    },
  };
}
