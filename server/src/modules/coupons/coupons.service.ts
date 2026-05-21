import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";

function mapCoupon(coupon: any) {
  return {
    ...coupon,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
  };
}

export async function listCoupons() {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: [{ expiresAt: "asc" }, { title: "asc" }],
  });

  return coupons.map(mapCoupon);
}

export async function getCoupon(id: string) {
  const coupon = await prisma.coupon.findFirst({ where: { id, isActive: true } });
  if (!coupon) throw new HttpError(404, "NOT_FOUND", "Coupon not found");
  return mapCoupon(coupon);
}
