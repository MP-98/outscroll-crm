import { z } from "zod";
import { optionalStringSchema, tagsSchema } from "./common";

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  industry: optionalStringSchema.nullable().default(null),
  ig_handle: z
    .string()
    .transform((v) => v.trim().replace(/^@/, ""))
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  website: optionalStringSchema.nullable().default(null),
  tags: tagsSchema,
});

export const brandPocSchema = z.object({
  full_name: z.string().trim().min(1, "Required"),
  role_title: optionalStringSchema.nullable().default(null),
  email: z
    .union([z.string().email(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  phone: optionalStringSchema.nullable().default(null),
  ig_handle: optionalStringSchema.nullable().default(null),
  linkedin_url: optionalStringSchema.nullable().default(null),
  notes: optionalStringSchema.nullable().default(null),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type BrandPocInput = z.infer<typeof brandPocSchema>;
