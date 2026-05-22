import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().min(1) });
export const groupIdParamSchema = z.object({ groupId: z.string().min(1) });
export const memberIdParamSchema = z.object({ memberId: z.string().min(1) });
export const expenseIdParamSchema = z.object({ expenseId: z.string().min(1) });
export const settlementIdParamSchema = z.object({ settlementId: z.string().min(1) });
export const friendIdParamSchema = z.object({ friendId: z.string().min(1) });

const memberInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().nullable(),
  userId: z.string().trim().min(1).optional().nullable(),
  avatarUrl: z.string().trim().url().optional().nullable(),
  isCurrentUser: z.coerce.boolean().optional(),
  isRegisteredUser: z.coerce.boolean().optional(),
  role: z.string().trim().min(1).max(40).optional(),
});

export const createSplitGroupSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).optional().nullable(),
  currency: z.string().trim().min(3).max(3).default("EUR"),
  imageUrl: z.string().trim().url().optional().nullable(),
  members: z.array(memberInputSchema).min(1).optional(),
});

export const updateSplitGroupSchema = createSplitGroupSchema
  .omit({ members: true })
  .extend({ archivedAt: z.string().datetime().optional().nullable() })
  .partial();

export const createSplitMemberSchema = memberInputSchema;
export const updateSplitMemberSchema = memberInputSchema.partial();

export const splitShareSchema = z.object({
  memberId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  amountCents: z.coerce.number().int().positive().optional(),
  percentage: z.coerce.number().positive().max(100).optional(),
});

const splitExpenseInputSchema = z.object({
  paidByMemberId: z.string().min(1),
  title: z.string().trim().min(1).max(255),
  category: z.string().trim().max(80).optional().nullable(),
  amount: z.coerce.number().positive().optional(),
  amountCents: z.coerce.number().int().positive().optional(),
  date: z.string().date(),
  splitType: z.enum(["EQUAL", "CUSTOM", "PERCENTAGE"]).default("EQUAL"),
  notes: z.string().trim().max(1000).optional().nullable(),
  shares: z.array(splitShareSchema).min(1),
});

export const createSplitExpenseSchema = splitExpenseInputSchema.refine((value) => value.amountCents || value.amount, {
  message: "Amount is required.",
  path: ["amount"],
});

export const updateSplitExpenseSchema = splitExpenseInputSchema.partial().refine((value) => value.amountCents || value.amount || Object.keys(value).length > 0, {
  message: "Amount is required.",
  path: ["amount"],
});

const splitSettlementInputSchema = z.object({
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  amountCents: z.coerce.number().int().positive().optional(),
  date: z.string().date().optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createSplitSettlementSchema = splitSettlementInputSchema.refine((value) => value.amountCents || value.amount, {
  message: "Amount is required.",
  path: ["amount"],
});

export type CreateSplitGroupInput = z.infer<typeof createSplitGroupSchema>;
export type UpdateSplitGroupInput = z.infer<typeof updateSplitGroupSchema>;
export type CreateSplitMemberInput = z.infer<typeof createSplitMemberSchema>;
export type UpdateSplitMemberInput = z.infer<typeof updateSplitMemberSchema>;
export type CreateSplitExpenseInput = z.infer<typeof createSplitExpenseSchema>;
export type UpdateSplitExpenseInput = z.infer<typeof updateSplitExpenseSchema>;
export type CreateSplitSettlementInput = z.infer<typeof createSplitSettlementSchema>;
