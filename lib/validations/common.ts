import { z } from "zod";

export const idSchema = z.string().uuid();

// Coerces empty strings / NaN / null / undefined to null; otherwise to a non-negative integer.
export const optionalIntSchema = z.preprocess(
  (v) => {
    if (v === "" || v == null) return null;
    if (typeof v === "number" && Number.isNaN(v)) return null;
    return v;
  },
  z.union([z.coerce.number().int().nonnegative(), z.null()]),
);

export const optionalDecimalSchema = z.preprocess(
  (v) => {
    if (v === "" || v == null) return null;
    if (typeof v === "number" && Number.isNaN(v)) return null;
    return v;
  },
  z.union([z.coerce.number().nonnegative(), z.null()]),
);

export const optionalStringSchema = z.preprocess(
  (v) => {
    if (v == null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? null : t;
    }
    return v;
  },
  z.union([z.string(), z.null()]),
);

export const optionalDateSchema = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]),
);

export const requiredDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Required");

export const tagsSchema = z.array(z.string().trim().min(1)).default([]);
