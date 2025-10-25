import { Product } from './product.model';

export interface CartItem {
  id?: number;            // puede no existir si es local
  product: Product;       // producto completo
  quantity: number;       // cantidad de unidades
}
