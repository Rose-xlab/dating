import { Json } from '@/types/supabase';

/**
 * Converts any object to Supabase's Json type by serializing and deserializing
 * This ensures the object conforms to Json's requirements
 */
export function toSupabaseJson<T>(obj: T): Json {
  return JSON.parse(JSON.stringify(obj)) as Json;
}

/**
 * Batch convert multiple fields to Json type
 */
export function convertToSupabaseFormat<T extends Record<string, any>>(data: T): Record<keyof T, Json> {
  const result: Partial<Record<keyof T, Json>> = {};
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      result[key] = toSupabaseJson(data[key]);
    }
  }
  
  return result as Record<keyof T, Json>;
}

/**
 * Type guard to check if a value can be safely converted to Json
 */
export function isJsonCompatible(value: unknown): value is Json {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  
  if (Array.isArray(value)) {
    return value.every(isJsonCompatible);
  }
  
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every(isJsonCompatible);
  }
  
  return false;
}