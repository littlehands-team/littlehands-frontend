// cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../shared/models/cart-item.model';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  loading: boolean = true;
  updatingItem: number | null = null; // ID del item que se está actualizando

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCartItems().subscribe({
      next: (items) => {
        this.cartItems = items;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando carrito:', err);
        this.loading = false;
      }
    });
  }

  // Calcular precio final de un producto (con descuento)
  calculateFinalPrice(product: Product): number {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    if (product.discount_percentage > 0) {
      const discount = (price * product.discount_percentage) / 100;
      return price - discount;
    }
    return price;
  }

  // Calcular subtotal de un item (precio final * cantidad)
  calculateItemSubtotal(item: CartItem): number {
    return this.calculateFinalPrice(item.product) * item.quantity;
  }

  // Calcular total del carrito
  get cartTotal(): number {
    return this.cartItems.reduce((total, item) => {
      // Solo sumar productos activos
      if (item.product.is_active) {
        return total + this.calculateItemSubtotal(item);
      }
      return total;
    }, 0);
  }

  // Contar total de items activos
  get activeItemsCount(): number {
    return this.cartItems.filter(item => item.product.is_active).length;
  }

  // Contar productos desactivados
  get inactiveItemsCount(): number {
    return this.cartItems.filter(item => !item.product.is_active).length;
  }

  // Verificar si hay productos activos
  get hasActiveProducts(): boolean {
    return this.activeItemsCount > 0;
  }

  // Aumentar cantidad
  increaseQuantity(item: CartItem): void {
    if (!item.product.is_active) return;

    this.updatingItem = item.id || null;
    const newQuantity = item.quantity + 1;

    this.cartService.updateCartItemQuantity(item.id!, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        this.updatingItem = null;
      },
      error: (err) => {
        console.error('Error actualizando cantidad:', err);
        this.updatingItem = null;
      }
    });
  }

  // Disminuir cantidad
  decreaseQuantity(item: CartItem): void {
    if (!item.product.is_active || item.quantity <= 1) return;

    this.updatingItem = item.id || null;
    const newQuantity = item.quantity - 1;

    this.cartService.updateCartItemQuantity(item.id!, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        this.updatingItem = null;
      },
      error: (err) => {
        console.error('Error actualizando cantidad:', err);
        this.updatingItem = null;
      }
    });
  }

  // Eliminar item del carrito
  removeItem(item: CartItem): void {
    if (!item.id) {
      console.error('Item sin ID, no se puede eliminar');
      return;
    }

    // Confirmación
    if (!confirm(`¿Estás seguro de eliminar "${item.product.name}" del carrito?`)) {
      return;
    }

    this.updatingItem = item.id;

    this.cartService.removeCartItem(item.id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.id !== item.id);
        this.updatingItem = null;
      },
      error: (err) => {
        console.error('Error eliminando item:', err);
        this.updatingItem = null;
      }
    });
  }

  // Navegar al producto
  goToProduct(slug: string): void {
    this.router.navigate(['/tienda/producto', slug]);
  }

  // Continuar comprando
  continueShopping(): void {
    this.router.navigate(['/tienda']);
  }

  // Proceder al checkout
  proceedToCheckout(): void {
    if (!this.hasActiveProducts) return;

    // TODO: Implementar lógica de checkout
    this.router.navigate(['/checkout']);
  }

  // Verificar si un item se está actualizando
  isUpdating(itemId: number | undefined): boolean {
    return this.updatingItem === itemId;
  }
}
