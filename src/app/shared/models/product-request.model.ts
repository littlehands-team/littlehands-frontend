import {AgeCategory} from '../enums/age.enum';

export interface ProductRequest {
  name: string;
  slug: string;
  short_description: string;
  long_description: string;
  price: number;
  discount_percentage: number;
  image_url: string;
  youtube_links: string[];
  age_category: AgeCategory;
  added_by?: number;
  updated_by?: number;
  is_active: boolean;
}
