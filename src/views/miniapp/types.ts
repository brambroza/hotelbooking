export type SearchResult = {
  villa_id: string;
  villa_name: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  nights: number;
  is_available: boolean;

  member_tier: string | null;
  member_percent: number | null;

  total_before_member: number | null;
  member_discount_amount: number | null;
  total_after_member: number | null;

  promo_code: string | null;
  promo_is_valid: boolean | null;
  promo_message: string | null;
  promo_discount_amount: number | null;

  total_after_discount: number | null;

  breakdown: any[];
};
