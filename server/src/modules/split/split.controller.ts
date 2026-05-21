import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import { SplitService } from "./split.service.js";

export const listGroups = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listGroups(getUserId(req)));
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.getSummary(getUserId(req)));
});

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.createGroup(getUserId(req), req.body), 201);
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.getGroup(getIdParam(req, "groupId"), getUserId(req)));
});

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.updateGroup(getIdParam(req, "groupId"), getUserId(req), req.body));
});

export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.deleteGroup(getIdParam(req, "groupId"), getUserId(req)));
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listMembers(getIdParam(req, "groupId"), getUserId(req)));
});

export const createMember = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.createMember(getIdParam(req, "groupId"), getUserId(req), req.body), 201);
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.updateMember(getIdParam(req, "groupId"), getIdParam(req, "memberId"), getUserId(req), req.body));
});

export const deleteMember = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.deleteMember(getIdParam(req, "groupId"), getIdParam(req, "memberId"), getUserId(req)));
});

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listExpenses(getIdParam(req, "groupId"), getUserId(req)));
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.createExpense(getIdParam(req, "groupId"), getUserId(req), req.body), 201);
});

export const getExpense = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.getExpense(getIdParam(req, "expenseId"), getUserId(req)));
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.updateExpense(getIdParam(req, "expenseId"), getUserId(req), req.body));
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.deleteExpense(getIdParam(req, "expenseId"), getUserId(req)));
});

export const getBalances = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.getBalances(getIdParam(req, "groupId"), getUserId(req)));
});

export const listSettlements = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listSettlements(getIdParam(req, "groupId"), getUserId(req)));
});

export const createSettlement = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.createSettlement(getIdParam(req, "groupId"), getUserId(req), req.body), 201);
});

export const deleteSettlement = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.deleteSettlement(getIdParam(req, "settlementId"), getUserId(req)));
});

export const listFriendsBalances = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listFriendsBalances(getUserId(req)));
});

export const getFriend = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.getFriend(decodeURIComponent(getIdParam(req, "friendId")), getUserId(req)));
});

export const listActivity = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listActivity(getUserId(req)));
});

export const listGroupActivity = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SplitService.listGroupActivity(getIdParam(req, "groupId"), getUserId(req)));
});
