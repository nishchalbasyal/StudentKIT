import { prisma } from "../../database/prisma.js";
import { parseTimeOnly, toTimeOnlyString } from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "./companies.schemas.js";

function mapCompany(item: any) {
  return {
    ...item,
    defaultHourlyWage: item.defaultHourlyWage ? Number(item.defaultHourlyWage) : null,
    defaultBonusValue: item.defaultBonusValue ? Number(item.defaultBonusValue) : null,
    commonStartTime: item.commonStartTime ? toTimeOnlyString(item.commonStartTime) : null,
    commonEndTime: item.commonEndTime ? toTimeOnlyString(item.commonEndTime) : null,
  };
}

function toCompanyData(data: CreateCompanyInput | UpdateCompanyInput) {
  return {
    ...data,
    commonStartTime: data.commonStartTime ? parseTimeOnly(data.commonStartTime) : data.commonStartTime,
    commonEndTime: data.commonEndTime ? parseTimeOnly(data.commonEndTime) : data.commonEndTime,
  } as any;
}

export class CompaniesService {
  static async getAllCompanies(userId: string) {
    const companies = await prisma.company.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: "asc" },
    });

    return companies.map(mapCompany);
  }

  static async getCompanyById(id: string, userId: string) {
    const company = await prisma.company.findFirst({
      where: { id, userId },
      include: { workShifts: { orderBy: { date: "desc" }, take: 5 } },
    });

    if (!company) {
      throw new HttpError(404, "NOT_FOUND", "Company not found");
    }

    return mapCompany(company);
  }

  static async createCompany(userId: string, data: CreateCompanyInput) {
    const company = await prisma.company.create({
      data: {
        userId,
        ...toCompanyData(data),
      } as any,
    });

    return mapCompany(company);
  }

  static async updateCompany(
    id: string,
    userId: string,
    data: UpdateCompanyInput,
  ) {
    const company = await prisma.company.findFirst({ where: { id, userId } });
    if (!company) {
      throw new HttpError(404, "NOT_FOUND", "Company not found");
    }

    const updated = await prisma.company.update({
      where: { id },
      data: toCompanyData(data),
    });

    return mapCompany(updated);
  }

  static async deleteCompany(id: string, userId: string) {
    const company = await prisma.company.findFirst({
      where: { id, userId },
      include: { workShifts: true },
    });

    if (!company) {
      throw new HttpError(404, "NOT_FOUND", "Company not found");
    }

    if (company.workShifts.length > 0) {
      const archived = await prisma.company.update({
        where: { id },
        data: { isArchived: true, archivedAt: new Date() },
      });

      return {
        ...mapCompany(archived),
        archived: true,
        message: "Company archived because it has work history.",
      };
    }

    const deleted = await prisma.company.delete({ where: { id } });
    return { ...mapCompany(deleted), archived: false };
  }
}
