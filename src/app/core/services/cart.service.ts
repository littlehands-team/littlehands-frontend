import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CartItem} from '../../shared/models/cart-item.model';
import { CryptoService} from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart/`;
  private localKey = 'hh-cart-items';
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable(); // 👈 suscribible desde AppNavbar

  constructor(private http: HttpClient, private crypto: CryptoService) {
    this.syncCartCount();
  }

  // 🔹 Ver carrito desde backend o localStorage
  getCartItems(): Observable<CartItem[]> {
    const userId = this.crypto.getCurrentUserId();

    // 🧩 Si no hay usuario logueado → usar localStorage
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, obteniendo carrito local.');
      const localCart = this.getCartItemsLocal(); // [{ productId, quantity }]
      if (!localCart || localCart.length === 0) return of([]);

      const productIds = localCart.map(item => item.product.id);
      const url = `${this.apiUrl}products-by-ids/`;

      return this.http.post<any[]>(url, { product_ids: productIds }).pipe(
        map(products => {
          // Mapear los productos con las cantidades locales
          const cartItems: CartItem[] = localCart.map(item => {
            const product = products.find(p => p.id === item.product.id);
            if (!product) return null; // por si algún producto ya no existe
            return {
              product,
              quantity: item.quantity
            };
          }).filter(Boolean) as CartItem[]; // eliminar nulls
          return cartItems;
        }),
        catchError(err => {
          console.warn('⚠️ Error al obtener productos desde backend, devolviendo carrito local.', err);
          // Retorna carrito local pero sin objeto Product completo
          return of(localCart.map(item => ({
            product: { id: item.product.id, name: 'Producto no disponible' } as any,
            quantity: item.quantity
          })));
        })
      );
    }

    // 🧠 Si hay usuario → intentar obtener desde backend
    const url = `${this.apiUrl}?user_id=${userId}`;
    return this.http.get<CartItem[]>(url).pipe(
      map((items) => {
        // Guardar también en localStorage como respaldo
        this.saveCartItemsLocal(items);
        return items;
      }),
      catchError(err => {
        console.warn('⚠️ Error al obtener carrito desde backend, usando localStorage.', err);
        return of(this.getCartItemsLocal());
      })
    );
  }

  addCartItem(productId: number, quantity: number = 1): Observable<any> {
    const userId = this.crypto.getCurrentUserId();

    // Si no hay usuario logeado, guardar solo en localStorage
    if (!userId) {
      this.addCartItemLocal(productId, quantity);
      this.syncCartCount();
      return of({ success: true, message: 'Producto añadido al carrito de compras.' });
    }

    // Usuario autenticado: enviar al backend
    const body = { user_id: userId, product_id: productId, quantity };

    return this.http.post<any>(`${this.apiUrl}`, body).pipe(
      tap((response) => {
        if (response && !response.error) {
          console.log('✅ Producto añadido correctamente al backend.');
          this.addCartItemLocal(productId, quantity);
          this.syncCartCount();
        }
      }),
      catchError(err => {
        console.warn('⚠️ Error con backend, guardando en localStorage.');
        this.addCartItemLocal(productId, quantity);
        this.syncCartCount();
        return of({ message: 'Producto añadido al carrito (local).' });
      })
    );
  }

  // ✅ Eliminar producto del carrito (backend o localStorage)
  removeCartItem(itemId: number): Observable<any> {
    const userId = this.crypto.getCurrentUserId();

    // ⚠️ Si no hay usuario autenticado → eliminar solo en localStorage
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, eliminando en localStorage.');
      this.removeCartItemLocal(itemId);
      this.syncCartCount();
      return of({ message: 'Producto eliminado del carrito local.' });
    }

    // ✅ Si hay usuario, eliminar desde backend
    const body = { item_id: itemId };

    return this.http.request<any>('delete', `${this.apiUrl}`, { body }).pipe(
      map(res => {
        // También eliminar del localStorage para mantener sincronizado
        this.removeCartItemLocal(itemId);
        this.syncCartCount();
        return res;
      }),
      catchError(err => {
        console.warn('⚠️ Error al eliminar en backend, usando localStorage.', err);
        this.removeCartItemLocal(itemId);
        this.syncCartCount();
        return of({ message: 'Producto eliminado del carrito local (fallback).' });
      })
    );
  }

  // 🔹 Actualizar cantidad de un producto en el carrito
  updateCartItemQuantity(cartItemId: number, newQuantity: number): Observable<any> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, actualizando en localStorage.');
      this.updateCartItemQuantityLocal(cartItemId, newQuantity);
      this.syncCartCount();
      return of({ message: 'Cantidad actualizada en carrito local.' });
    }

    // 🔸 El backend espera "item_id", no "cart_item_id"
    const body = { user_id: userId, item_id: cartItemId, quantity: newQuantity };

    return this.http.put<any>(`${this.apiUrl}`, body).pipe(
      map(res => {
        // ✅ Si el backend responde correctamente, también actualizamos el localStorage
        this.updateCartItemQuantityLocal(cartItemId, newQuantity);
        this.syncCartCount();
        return res;
      }),
      catchError(err => {
        console.warn('⚠️ Error al actualizar en backend, usando localStorage.', err);
        this.updateCartItemQuantityLocal(cartItemId, newQuantity);
        this.syncCartCount();
        return of({ message: 'Cantidad actualizada en carrito local (fallback).' });
      })
    );
  }

  // 🔹 Versión local (solo actualiza el storage)
  private updateCartItemQuantityLocal(cartItemId: number, newQuantity: number): void {
    const items = this.getCartItemsLocal();
    const item = items.find(i => i.id === cartItemId || i.product.id === cartItemId);

    if (item) {
      if (newQuantity <= 0) {
        // ✅ Validamos que el id del producto exista antes de eliminar
        const productId = item.product?.id;
        if (productId !== undefined && productId !== null) {
          this.removeCartItemLocal(productId);
        } else {
          console.warn('⚠️ No se pudo eliminar item local: product.id indefinido.');
        }
      } else {
        item.quantity = newQuantity;
        this.saveCartItemsLocal(items);
      }
    }
  }

  // 🔹 Vaciar carrito después de compra (backend o local)
  clearCartAfterCheckout(itemIds: number[]): Observable<any> {
    const userId = this.crypto.getCurrentUserId();

    // Si no hay usuario, limpiar localStorage directamente
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, limpiando carrito local.');
      this.clearCartLocal();
      this.syncCartCount();
      return of({ message: 'Carrito local vaciado.' });
    }

    // Backend: eliminar ítems específicos
    const body = { user_id: userId, item_ids: itemIds };

    return this.http.request<any>('delete', `${this.apiUrl}clear/`, { body }).pipe(
      tap(() => {
        this.clearCartLocal(); // sincronizar localmente
        this.syncCartCount();
      }),
      catchError(err => {
        console.warn('⚠️ Error backend, limpiando carrito local.', err);
        this.clearCartLocal();
        this.syncCartCount();
        return of({ message: 'Carrito local vaciado (fallback).' });
      })
    );
  }


  // =============================
  // 💾 LOCAL STORAGE FALLBACK
  // =============================

  private getCartItemsLocal(): CartItem[] {
    const data = localStorage.getItem(this.localKey);
    return data ? JSON.parse(data) : [];
  }

  private saveCartItemsLocal(items: CartItem[]): void {
    localStorage.setItem(this.localKey, JSON.stringify(items));
  }

  private addCartItemLocal(productId: number, quantity: number = 1): void {
    const items = this.getCartItemsLocal();
    const existingItem = items.find(i => i.product.id === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      // Guardamos producto "mínimo" localmente (sin requerir backend)
      items.push({
        product: { id: productId } as any,
        quantity
      });
    }

    this.saveCartItemsLocal(items);
  }

  private removeCartItemLocal(productId: number): void {
    const items = this.getCartItemsLocal().filter(i => i.product.id !== productId);
    this.saveCartItemsLocal(items);
  }

  clearCartLocal(): void {
    localStorage.removeItem(this.localKey);
  }

  // =============================
  // 🔁 Sincronización del contador
  // =============================

  syncCartCount(): void {
    const items = this.getCartItemsLocal();
    const count = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    this.cartCountSubject.next(count);
  }
}
