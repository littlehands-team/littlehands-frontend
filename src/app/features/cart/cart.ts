// cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../shared/models/cart-item.model';
import { Product } from '../../shared/models/product.model';
import {CryptoService} from '../../core/services/crypto.service';

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
    private router: Router,
    private cryptoService: CryptoService
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

  // ✅ Aumentar cantidad
  increaseQuantity(item: CartItem): void {
    if (!item.product.is_active) return;

    this.updatingItem = item.id || item.product.id || null;
    const newQuantity = item.quantity + 1;

    // 🔹 Llamar servicio (usa backend o localStorage automáticamente)
    this.cartService.updateCartItemQuantity(item.id ?? item.product.id!, newQuantity).subscribe({
      next: (res) => {
        console.log('✅ Cantidad aumentada:', res);
        item.quantity = newQuantity;
        this.updatingItem = null;
      },
      error: (err) => {
        console.error('❌ Error actualizando cantidad:', err);
        this.updatingItem = null;
      }
    });
  }

  // ✅ Disminuir cantidad
  decreaseQuantity(item: CartItem): void {
    if (!item.product.is_active || item.quantity <= 1) return;

    this.updatingItem = item.id || item.product.id || null;
    const newQuantity = item.quantity - 1;

    this.cartService.updateCartItemQuantity(item.id ?? item.product.id!, newQuantity).subscribe({
      next: (res) => {
        console.log('✅ Cantidad reducida:', res);
        item.quantity = newQuantity;
        this.updatingItem = null;
      },
      error: (err) => {
        console.error('❌ Error actualizando cantidad:', err);
        this.updatingItem = null;
      }
    });
  }

  // ✅ Eliminar item del carrito (funciona con backend o localStorage)
  removeItem(item: CartItem): void {
    const itemId = item.id ?? item.product.id; // soporte para localStorage
    if (!itemId) {
      console.error('❌ Item sin ID válido, no se puede eliminar');
      return;
    }

    // Confirmación con nombre del producto
    if (!confirm(`🗑️ ¿Eliminar "${item.product.name}" del carrito?`)) return;

    this.updatingItem = itemId;

    this.cartService.removeCartItem(itemId).subscribe({
      next: (res) => {
        console.log('✅ Item eliminado:', res);

        // 🔹 Actualizar lista local (elimina del array actual)
        this.cartItems = this.cartItems.filter(
          i => (i.id ?? i.product.id) !== itemId
        );

        this.updatingItem = null;
      },
      error: (err) => {
        console.error('❌ Error eliminando item:', err);
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
    const currentUser = this.cryptoService.getCurrentUser();
    if (!this.hasActiveProducts) return;

    const activeCartItems = this.cartItems.filter(item => item.product.is_active);
    const total = activeCartItems.reduce(
      (sum, item) => sum + this.calculateItemSubtotal(item),
      0
    );

    if (activeCartItems.length === 0) {
      alert('No hay productos activos para comprar.');
      return;
    }

    // ✅ Generar mensaje de WhatsApp
    let message = '🛒 *Nuevo pedido desde HappyHands*\n\n';
    activeCartItems.forEach((item, i) => {
      message += `#${i + 1}. *${item.product.name}*\n`;
      message += `Cantidad: ${item.quantity}\n`;
      message += `Subtotal: S/ ${this.calculateItemSubtotal(item).toFixed(2)}\n\n`;
    });

    message += `*Total: S/ ${total.toFixed(2)}*\n\n`;

    // ✅ Agregar información del cliente
    if (currentUser) {
      const name =
        `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Cliente registrado';
      const email = currentUser.email ? ` (${currentUser.email})` : '';
      message += `👤 Cliente: ${name}${email}\n`;
    } else {
      message += '👤 Cliente: Invitado (no registrado)\n';
    }

    message += '\nPor favor confirmar la disponibilidad de los productos. 🙌';

    // ✅ Número de WhatsApp de la empresa (con código de país)
    const phoneNumber = '51924052944';

    // ✅ Crear URL de WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // ✅ Abrir WhatsApp en nueva pestaña
    window.open(whatsappUrl, '_blank');
  }

  // Verificar si un item se está actualizando
  isUpdating(itemId: number | undefined): boolean {
    return this.updatingItem === itemId;
  }
}
