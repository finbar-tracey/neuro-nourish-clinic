/** Parse / format values for Upstash REST (Vercel KV). */

export function parseKvJsonResult<T>(result: string): T {
  let parsed: unknown = JSON.parse(result);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return parsed as T;
}

export function kvSetBody(serialized: string): string {
  return serialized;
}
