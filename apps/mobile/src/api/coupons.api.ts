import { apiClient, unwrap } from "./apiClient";
import type { Coupon } from "../types/content.types";

export async function getCouponsApi() {
  return unwrap<Coupon[]>(await apiClient.get("/coupons"));
}

export async function getCouponApi(id: string) {
  return unwrap<Coupon>(await apiClient.get(`/coupons/${id}`));
}
