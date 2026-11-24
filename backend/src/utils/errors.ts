interface KnownServerError {
  code?: unknown;
  constraint?: unknown;
}

export function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'UNKNOWN';
  const code = (error as KnownServerError).code;
  return typeof code === 'string' ? code : 'UNKNOWN';
}

export function getErrorConstraint(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const constraint = (error as KnownServerError).constraint;
  return typeof constraint === 'string' ? constraint : undefined;
}

export function logServerError(event: string, error: unknown): void {
  const constraint = getErrorConstraint(error);
  console.error(JSON.stringify({
    event,
    code: getErrorCode(error),
    errorType: error instanceof Error ? error.name : 'UnknownError',
    ...(constraint ? { constraint } : {}),
  }));
}
