// src/app/shared/models/product-shop-response.model.ts
import { Product } from './product.model';

export interface PriceRange {
  min: number;
  max: number;
}

export interface AppliedFilters {
  min_price: number | null;
  max_price: number | null;
  ages: string[];
}

export interface ProductShopResponse {
  products: Product[];
  has_more: boolean;
  page: number;
  page_size: number;
  total_products: number;
  loaded_count: number;
  next_page: number | null;
  total_pages: number;
  price_range: PriceRange;
  applied_filters: AppliedFilters;
}
