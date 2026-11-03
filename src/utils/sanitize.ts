/**
 * Recursively cleans an object/array so no key has an 'undefined' value.
 * Converts 'undefined' values to 'null' to ensure complete Firestore SDK compatibility.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val === undefined) {
      cleanObj[key] = null;
    } else if (val !== null && typeof val === 'object') {
      cleanObj[key] = sanitizeForFirestore(val);
    } else {
      cleanObj[key] = val;
    }
  }
  return cleanObj as T;
}
