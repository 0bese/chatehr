import { customAlphabet } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { tool } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

// Helper function to convert JSON Schema to Zod schema
function jsonSchemaToZod(schema: any): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.any();
  }

  switch (schema.type) {
    case "object":
      if (schema.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        for (const [key, value] of Object.entries(schema.properties)) {
          shape[key] = jsonSchemaToZod(value as any);
        }
        let zodObject = z.object(shape);

        // Handle required fields
        if (!schema.required || schema.required.length === 0) {
          return zodObject.partial();
        } else {
          // Make non-required fields optional
          const optionalFields = Object.keys(shape).filter(
            (key) => !schema.required.includes(key)
          );
          if (optionalFields.length > 0) {
            return zodObject.partial(
              optionalFields.reduce((acc, field) => {
                acc[field] = true;
                return acc;
              }, {} as Record<string, true>)
            );
          }
        }

        return zodObject;
      }
      return z.object({});

    case "string":
      if (schema.default !== undefined) {
        return z.string().default(schema.default);
      }
      return z.string();

    case "number":
      if (schema.default !== undefined) {
        return z.number().default(schema.default);
      }
      return z.number();

    case "integer":
      if (schema.default !== undefined) {
        return z.number().int().default(schema.default);
      }
      return z.number().int();

    case "boolean":
      if (schema.default !== undefined) {
        return z.boolean().default(schema.default);
      }
      return z.boolean();

    case "array":
      if (schema.items) {
        return z.array(jsonSchemaToZod(schema.items));
      }
      return z.array(z.any());

    default:
      // Handle anyOf, oneOf, etc.
      if (schema.anyOf && Array.isArray(schema.anyOf)) {
        // For anyOf with null, make it optional
        if (schema.anyOf.some((item: any) => item.type === "null")) {
          const nonNullSchema = schema.anyOf.find(
            (item: any) => item.type !== "null"
          );
          if (nonNullSchema) {
            return jsonSchemaToZod(nonNullSchema).optional();
          }
        }
        // For other anyOf cases, use the first non-null type
        const firstSchema = schema.anyOf[0];
        return jsonSchemaToZod(firstSchema);
      }

      return z.any();
  }
}

export function convertMCPToolToAiTool(mcpTool: any) {
  return {
    [mcpTool.name]: tool({
      description: mcpTool.description,
      // Convert the JSON Schema to a Zod schema
      inputSchema: jsonSchemaToZod(mcpTool.schema),
      execute: async (input: any) => {
        return await mcpTool.func(input);
      },
    }),
  };
}
