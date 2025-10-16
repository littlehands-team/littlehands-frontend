export interface ProductRequest {
  name: string;
  short_description: string;
  long_description: string;
  price: number;
  discount_percentage: number;
  image_url: string;
  youtube_links: string[];
  added_by?: number;
  updated_by?: number;
  is_active: boolean;
}
