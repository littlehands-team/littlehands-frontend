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
  private localKey = 'hh-local-cart-items';           // 🧩 Usuarios no autenticados
  private authenticatedKey = 'hh-auth-cart-items';    // 🔐 Usuarios autenticados
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable(); // 👈 suscribible desde AppNavbar

  constructor(private http: HttpClient, private crypto: CryptoService) {
    this.syncCartCount();
  }

  // ======================================================
  // 🛒 OBTENER CARRITO (backend o local)
  // ======================================================
  getCartItems(): Observable<CartItem[]> {
    const userId = this.crypto.getCurrentUserId();

    // 🧩 Caso: usuario no autenticado → usar localStorage + backend products
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, obteniendo carrito local.');
      const localCart = this.getCartItemsLocal(this.localKey); // [{ product: {id}, quantity }]
      if (!localCart || localCart.length === 0) return of([]);

      const productIds = localCart.map(item => item.product.id);
      const url = `${this.apiUrl}products-by-ids/`;

      return this.http.post<any[]>(url, { product_ids: productIds }).pipe(
        map(products => {
          const cartItems: CartItem[] = localCart.map(item => {
            const product = products.find(p => p.id === item.product.id);
            if (!product) return null;
            return { product, quantity: item.quantity };
          }).filter(Boolean) as CartItem[];

          this.saveCartItemsLocal(cartItems, this.localKey);
          return cartItems;
        }),
        catchError(err => {
          console.warn('⚠️ Error al obtener productos desde backend, devolviendo carrito local.', err);
          return of(localCart.map(item => ({
            product: { id: item.product.id, name: 'Producto no disponible' } as any,
            quantity: item.quantity
          })));
        })
      );
    }

    // 🧠 Caso: usuario autenticado → obtener carrito completo del backend
    const url = `${this.apiUrl}?user_id=${userId}`;
    return this.http.get<CartItem[]>(url).pipe(
      map(items => {
        this.saveCartItemsLocal(items, this.authenticatedKey); // 🗂️ respaldo solo para usuarios logeados
        return items;
      }),
      catchError(err => {
        console.warn('⚠️ Error al obtener carrito desde backend, usando respaldo local.', err);
        return of(this.getCartItemsLocal(this.authenticatedKey));
      })
    );
  }

  // ======================================================
  // 🟢 AÑADIR PRODUCTO
  // ======================================================
  addCartItem(productId: number, quantity: number = 1): Observable<any> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      this.addCartItemLocal(productId, quantity, this.localKey);
      this.syncCartCount();
      return of({ success: true, message: 'Producto añadido al carrito local.' });
    }

    const body = { user_id: userId, product_id: productId, quantity };

    return this.http.post<any>(`${this.apiUrl}`, body).pipe(
      tap(response => {
        if (response && !response.error) {
          console.log('✅ Producto añadido correctamente al backend.');
          this.addCartItemLocal(productId, quantity, this.authenticatedKey);
          this.syncCartCount();
        }
      }),
      catchError(err => {
        console.warn('⚠️ Error con backend, guardando respaldo local.');
        this.addCartItemLocal(productId, quantity, this.authenticatedKey);
        this.syncCartCount();
        return of({ message: 'Producto añadido al carrito local (fallback).' });
      })
    );
  }

  // ======================================================
  // 🔴 ELIMINAR PRODUCTO
  // ======================================================
  removeCartItem(itemId: number): Observable<any> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      this.removeCartItemLocal(itemId, this.localKey);
      this.syncCartCount();
      return of({ message: 'Producto eliminado del carrito local.' });
    }

    const body = { item_id: itemId };

    return this.http.request<any>('delete', `${this.apiUrl}`, { body }).pipe(
      map(res => {
        this.removeCartItemLocal(itemId, this.authenticatedKey);
        this.syncCartCount();
        return res;
      }),
      catchError(err => {
        console.warn('⚠️ Error al eliminar en backend, usando respaldo local.', err);
        this.removeCartItemLocal(itemId, this.authenticatedKey);
        this.syncCartCount();
        return of({ message: 'Producto eliminado del carrito local (fallback).' });
      })
    );
  }

  // ======================================================
  // ✏️ ACTUALIZAR CANTIDAD
  // ======================================================
  updateCartItemQuantity(cartItemId: number, newQuantity: number): Observable<any> {
    const userId = this.crypto.getCurrentUserId();
    const key = userId ? this.authenticatedKey : this.localKey;

    if (!userId) {
      this.updateCartItemQuantityLocal(cartItemId, newQuantity, key);
      this.syncCartCount();
      return of({ message: 'Cantidad actualizada en carrito local.' });
    }

    const body = { user_id: userId, item_id: cartItemId, quantity: newQuantity };

    return this.http.put<any>(`${this.apiUrl}`, body).pipe(
      map(res => {
        this.updateCartItemQuantityLocal(cartItemId, newQuantity, key);
        this.syncCartCount();
        return res;
      }),
      catchError(err => {
        console.warn('⚠️ Error al actualizar en backend, usando respaldo local.', err);
        this.updateCartItemQuantityLocal(cartItemId, newQuantity, key);
        this.syncCartCount();
        return of({ message: 'Cantidad actualizada en carrito local (fallback).' });
      })
    );
  }

  // ======================================================
  // 🧹 LIMPIAR CARRITO
  // ======================================================
  clearCartAfterCheckout(itemIds: number[]): Observable<any> {
    const userId = this.crypto.getCurrentUserId();
    const key = userId ? this.authenticatedKey : this.localKey;

    if (!userId) {
      this.clearCartLocal(key);
      this.syncCartCount();
      return of({ message: 'Carrito local vaciado.' });
    }

    const body = { user_id: userId, item_ids: itemIds };

    return this.http.request<any>('delete', `${this.apiUrl}clear/`, { body }).pipe(
      tap(() => {
        this.clearCartLocal(key);
        this.syncCartCount();
      }),
      catchError(err => {
        console.warn('⚠️ Error backend, limpiando respaldo local.', err);
        this.clearCartLocal(key);
        this.syncCartCount();
        return of({ message: 'Carrito local vaciado (fallback).' });
      })
    );
  }

  // ======================================================
  // 💾 LOCAL STORAGE HELPERS
  // ======================================================
  private getCartItemsLocal(key: string): CartItem[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveCartItemsLocal(items: CartItem[], key: string): void {
    localStorage.setItem(key, JSON.stringify(items));
  }

  private addCartItemLocal(productId: number, quantity: number, key: string): void {
    const items = this.getCartItemsLocal(key);
    const existingItem = items.find(i => i.product.id === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({ product: { id: productId } as any, quantity });
    }

    this.saveCartItemsLocal(items, key);
  }

  private removeCartItemLocal(productId: number, key: string): void {
    const items = this.getCartItemsLocal(key).filter(i => i.product.id !== productId);
    this.saveCartItemsLocal(items, key);
  }

  private updateCartItemQuantityLocal(cartItemId: number, newQuantity: number, key: string): void {
    const items = this.getCartItemsLocal(key);
    const item = items.find(i => i.id === cartItemId || i.product.id === cartItemId);

    if (item) {
      if (newQuantity <= 0) {
        this.removeCartItemLocal(item.product.id!, key);
      } else {
        item.quantity = newQuantity;
        this.saveCartItemsLocal(items, key);
      }
    }
  }

  clearCartLocal(key: string): void {
    localStorage.removeItem(key);
  }

  // ======================================================
  // 🔁 CONTADOR GLOBAL
  // ======================================================
  syncCartCount(): void {
    const userId = this.crypto.getCurrentUserId();
    const key = userId ? this.authenticatedKey : this.localKey;
    const items = this.getCartItemsLocal(key);
    const count = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    this.cartCountSubject.next(count);
  }
}

