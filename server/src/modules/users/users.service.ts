import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type { AvatarInput, UpdateUserMeInput } from "./users.schemas.js";

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  country: string;
  studentStatus: string;
  hourlyWageDefault: unknown;
  currency: string;
  avatarUrl?: string | null;
  university?: string | null;
  course?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    country: user.country,
    studentStatus: user.studentStatus,
    hourlyWageDefault: user.hourlyWageDefault,
    currency: user.currency,
    avatarUrl: user.avatarUrl ?? null,
    university: user.university ?? null,
    course: user.course ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function hoursBetween(start: Date, end: Date, breakMinutes: number) {
  const diffMs = end.getTime() - start.getTime();
  const rawHours = diffMs > 0 ? diffMs / 3_600_000 : 0;
  return Math.max(0, rawHours - breakMinutes / 60);
}

function sameDate(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function calculateWorkStreak(dates: Date[]) {
  if (dates.length === 0) return 0;

  const uniqueDays = Array.from(new Set(dates.map((date) => date.toISOString().slice(0, 10)))).sort().reverse();
  let cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  const latest = new Date(`${uniqueDays[0]}T00:00:00.000Z`);
  if (!sameDate(latest, cursor)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!sameDate(latest, cursor)) return 0;
  }

  let streak = 0;
  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export class UsersService {
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");
    return publicUser(user);
  }

  static async updateMe(userId: string, input: UpdateUserMeInput) {
    const { yearlyWorkLimitDays, ...profile } = input;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...profile,
        country: profile.country?.toUpperCase(),
        currency: profile.currency?.toUpperCase(),
      },
    });

    if (
      yearlyWorkLimitDays !== undefined ||
      profile.currency !== undefined ||
      profile.country !== undefined ||
      profile.hourlyWageDefault !== undefined
    ) {
      await prisma.userSettings.upsert({
        where: { userId },
        update: {
          yearlyWorkLimitDays,
          currency: profile.currency?.toUpperCase(),
          workCountry: profile.country?.toUpperCase(),
          defaultHourlyWage: profile.hourlyWageDefault,
        },
        create: {
          userId,
          yearlyWorkLimitDays: yearlyWorkLimitDays ?? 140,
          currency: profile.currency?.toUpperCase() ?? user.currency,
          workCountry: profile.country?.toUpperCase() ?? user.country,
          defaultHourlyWage: profile.hourlyWageDefault ?? user.hourlyWageDefault,
        },
      });
    }

    return publicUser(user);
  }

  static async getSummary(userId: string) {
    const [user, expenses, workShifts, completedTasks, activeSplitGroups] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({ where: { userId }, select: { amount: true } }),
      prisma.workShift.findMany({
        where: { userId },
        select: { date: true, startTime: true, endTime: true, breakMinutes: true, hourlyWage: true },
      }),
      prisma.task.count({ where: { userId, status: "COMPLETED" } }),
      prisma.splitGroup.count({
        where: {
          archivedAt: null,
          OR: [{ ownerUserId: userId }, { members: { some: { userId } } }],
        },
      }),
    ]);

    if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const earnedTotal = workShifts.reduce((sum, shift) => {
      return sum + hoursBetween(shift.startTime, shift.endTime, shift.breakMinutes) * Number(shift.hourlyWage);
    }, 0);

    return {
      totalSaved: Math.max(0, Math.round((earnedTotal - expenseTotal) * 100) / 100),
      workStreak: calculateWorkStreak(workShifts.map((shift) => shift.date)),
      expensesTracked: expenses.length,
      tasksCompleted: completedTasks,
      activeSplitGroups,
      currency: user.currency,
    };
  }

  static async deleteMe(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { id: userId };
  }

  static async updateAvatar(userId: string, input: AvatarInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: input.avatarUrl },
    });
    return publicUser(user);
  }

  static async searchUsers(query: string, excludeUserId: string) {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: excludeUserId } },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  }
}
