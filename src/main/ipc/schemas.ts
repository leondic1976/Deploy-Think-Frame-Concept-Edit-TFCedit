import { z } from 'zod';
import type { AIProviderId } from '../../shared/aiProviders';
import { AI_PROVIDER_IDS } from '../../shared/aiProviders';

const aiProviderIdValues = [...AI_PROVIDER_IDS] as [AIProviderId, ...AIProviderId[]];
const aiProviderIdSchema = z.enum(aiProviderIdValues);

export const relativePathSchema = z.string().min(1).max(1024);

export const createFileSchema = z
  .object({
    name: z.string().max(240).optional(),
    extension: z.enum(['.md', '.txt']).optional(),
    content: z.string().max(10_000_000).optional(),
  })
  .strict();

export const writeFileSchema = z
  .object({
    relativePath: relativePathSchema,
    content: z.string().max(10_000_000),
    expectedModifiedAt: z.number().nonnegative().optional(),
  })
  .strict();

export const renameFileSchema = z
  .object({
    oldPath: relativePathSchema,
    newPath: z.string().min(1).max(240),
  })
  .strict();

export const settingsPatchSchema = z
  .object({
    lastDocument: z.string().nullable().optional(),
    reopenLastDocument: z.boolean().optional(),
    autoSave: z.boolean().optional(),
    autoSaveDelay: z.number().int().min(300).max(10_000).optional(),
    theme: z.enum(['system', 'light', 'dark']).optional(),
    fontSize: z.number().int().min(12).max(24).optional(),
    ai: z
      .object({
        providerName: z.string().min(1).max(100).optional(),
        providerId: aiProviderIdSchema.optional(),
        baseUrl: z.url().max(500).optional(),
        model: z.string().min(1).max(200).optional(),
        timeoutMs: z.number().int().min(5_000).max(180_000).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const analyzeRequestSchema = z
  .object({
    requestId: z.string().min(1).max(100),
    stage: z.enum(['organize', 'structure', 'validate', 'realize', 'prompt']),
    content: z.string().max(25_000),
    instructions: z.string().max(4_000).optional(),
  })
  .strict();

export const externalOpenSchema = z
  .object({
    urlKey: aiProviderIdSchema,
    text: z.string().max(100_000),
  })
  .strict();
