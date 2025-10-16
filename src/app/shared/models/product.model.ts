import { User } from './user.model';
import {AgeCategory} from '../enums/age.enum';

export interface Product {
  id?: number; // opcional al crear
  name: string;
  short_description: string;
  long_description: string;
  price: number;
  discount_percentage: number;
  image_url: string;
  youtube_links: string[];
  age_category: AgeCategory;
  added_by?: User;
  updated_by?: User;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
}
