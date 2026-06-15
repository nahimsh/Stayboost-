export interface FieldError {
  readonly field: string;
  readonly message: string;
}

/** Thrown for any non-2xx API response; parsed from RFC-7807 problem+json. */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly fieldErrors: ReadonlyArray<FieldError>;

  constructor(params: {
    status: number;
    title: string;
    detail?: string;
    fieldErrors?: ReadonlyArray<FieldError>;
  }) {
    super(params.detail ?? params.title);
    this.name = "ApiError";
    this.status = params.status;
    this.title = params.title;
    this.fieldErrors = params.fieldErrors ?? [];
  }
}

interface ProblemShape {
  title?: string;
  detail?: string;
  errors?: ReadonlyArray<FieldError>;
}

export async function errorFromResponse(response: Response): Promise<ApiError> {
  let problem: ProblemShape = {};
  try {
    problem = (await response.json()) as ProblemShape;
  } catch {
    // Non-JSON error body; fall back to status text.
  }
  return new ApiError({
    status: response.status,
    // statusText is empty over HTTP/2 — fall back to a status-derived string.
    title: problem.title ?? (response.statusText || `HTTP ${response.status}`),
    ...(problem.detail !== undefined ? { detail: problem.detail } : {}),
    ...(problem.errors !== undefined ? { fieldErrors: problem.errors } : {}),
  });
}
