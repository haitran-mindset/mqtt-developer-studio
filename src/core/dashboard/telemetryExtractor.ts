/**
 * Extract a numeric or string value from an incoming MQTT payload.
 * Supports:
 * - Raw numbers ("24.5", "100")
 * - Simple JSON Path (e.g., "$.temperature", "data.sensors[0].val", "status")
 * - Fallback to raw string
 */
export function extractTelemetryValue(
  rawPayload: string,
  jsonPath?: string
): number | string | null {
  if (rawPayload === undefined || rawPayload === null) {
    return null;
  }

  const trimmed = rawPayload.trim();

  // If jsonPath is provided or payload is JSON, attempt JSON parsing
  if (jsonPath || (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!jsonPath || jsonPath.trim() === '' || jsonPath.trim() === '$') {
        if (typeof parsed === 'number' || typeof parsed === 'string') {
          return parsed;
        }
        if (typeof parsed === 'boolean') {
          return parsed ? 'true' : 'false';
        }
        return JSON.stringify(parsed);
      }

      const val = resolveJsonPath(parsed, jsonPath.trim());
      if (val !== undefined && val !== null) {
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'string') {
          const num = Number(val);
          return !isNaN(num) && val.trim() !== '' ? num : val;
        }
        return JSON.stringify(val);
      }
    } catch {
      // JSON parse failed, fall back to raw handling
    }
  }

  // Raw numeric check
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') {
    return num;
  }

  // Return clean raw string
  return trimmed;
}

/**
 * Lightweight JSON path resolver supporting dot notation and array index.
 * Example paths: "temperature", "$.temperature", "data.readings[0].val", "$.devices.main.power"
 */
function resolveJsonPath(obj: any, path: string): any {
  if (obj === undefined || obj === null) return undefined;

  // Strip leading "$." or "$"
  let cleanPath = path;
  if (cleanPath.startsWith('$.')) {
    cleanPath = cleanPath.slice(2);
  } else if (cleanPath.startsWith('$')) {
    cleanPath = cleanPath.slice(1);
  }

  if (!cleanPath) return obj;

  // Normalize array access from foo[0] to foo.0
  const normalizedPath = cleanPath.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalizedPath.split('.').filter(Boolean);

  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }

  return current;
}
