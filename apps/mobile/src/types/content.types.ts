export type Coupon = {
  id: string;
  title: string;
  code?: string | null;
  discount: string;
  description?: string | null;
  terms?: string | null;
  url?: string | null;
  expiresAt?: string | null;
  source?: string | null;
};

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  organizer?: string | null;
  url?: string | null;
};
