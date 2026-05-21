import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import {
  createExpense,
  createGroup,
  createMember,
  createSettlement,
  deleteExpense,
  deleteGroup,
  deleteMember,
  deleteSettlement,
  getFriend,
  getBalances,
  getExpense,
  getGroup,
  getSummary,
  listActivity,
  listExpenses,
  listFriendsBalances,
  listGroupActivity,
  listGroups,
  listMembers,
  listSettlements,
  updateExpense,
  updateGroup,
  updateMember,
} from "./split.controller.js";
import {
  createSplitExpenseSchema,
  createSplitGroupSchema,
  createSplitMemberSchema,
  createSplitSettlementSchema,
  expenseIdParamSchema,
  friendIdParamSchema,
  groupIdParamSchema,
  memberIdParamSchema,
  settlementIdParamSchema,
  updateSplitExpenseSchema,
  updateSplitGroupSchema,
  updateSplitMemberSchema,
} from "./split.schemas.js";

export const splitRoutes = Router();

splitRoutes.use(authenticate);

splitRoutes.get("/summary", getSummary);
splitRoutes.get("/friends/balances", listFriendsBalances);
splitRoutes.get("/friends/:friendId", validateParams(friendIdParamSchema), getFriend);
splitRoutes.get("/activity", listActivity);

splitRoutes.get("/groups", listGroups);
splitRoutes.post("/groups", validateBody(createSplitGroupSchema), createGroup);
splitRoutes.get("/groups/:groupId", validateParams(groupIdParamSchema), getGroup);
splitRoutes.put("/groups/:groupId", validateParams(groupIdParamSchema), validateBody(updateSplitGroupSchema), updateGroup);
splitRoutes.delete("/groups/:groupId", validateParams(groupIdParamSchema), deleteGroup);

splitRoutes.get("/groups/:groupId/members", validateParams(groupIdParamSchema), listMembers);
splitRoutes.post("/groups/:groupId/members", validateParams(groupIdParamSchema), validateBody(createSplitMemberSchema), createMember);
splitRoutes.put("/groups/:groupId/members/:memberId", validateParams(groupIdParamSchema.merge(memberIdParamSchema)), validateBody(updateSplitMemberSchema), updateMember);
splitRoutes.delete("/groups/:groupId/members/:memberId", validateParams(groupIdParamSchema.merge(memberIdParamSchema)), deleteMember);

splitRoutes.get("/groups/:groupId/expenses", validateParams(groupIdParamSchema), listExpenses);
splitRoutes.post("/groups/:groupId/expenses", validateParams(groupIdParamSchema), validateBody(createSplitExpenseSchema), createExpense);
splitRoutes.get("/expenses/:expenseId", validateParams(expenseIdParamSchema), getExpense);
splitRoutes.put("/expenses/:expenseId", validateParams(expenseIdParamSchema), validateBody(updateSplitExpenseSchema), updateExpense);
splitRoutes.delete("/expenses/:expenseId", validateParams(expenseIdParamSchema), deleteExpense);

splitRoutes.get("/groups/:groupId/balances", validateParams(groupIdParamSchema), getBalances);
splitRoutes.post("/groups/:groupId/settlements", validateParams(groupIdParamSchema), validateBody(createSplitSettlementSchema), createSettlement);
splitRoutes.get("/groups/:groupId/settlements", validateParams(groupIdParamSchema), listSettlements);
splitRoutes.get("/groups/:groupId/activity", validateParams(groupIdParamSchema), listGroupActivity);
splitRoutes.delete("/settlements/:settlementId", validateParams(settlementIdParamSchema), deleteSettlement);
