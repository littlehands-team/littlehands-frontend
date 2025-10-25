import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';
import {Observable, of, tap} from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CartItem} from '../../shared/models/cart-item.model';
import { CryptoService} from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart/`;
  private localKey = 'hh-cart-items';

  constructor(private http: HttpClient, private crypto: CryptoService) {}

  // 🔹 Ver carrito desde backend o localStorage
  getCartItems(): Observable<CartItem[]> {
    const userId = this.crypto.getCurrentUserId();

    // 🧩 Si no hay usuario logueado → usar localStorage
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, obteniendo carrito local.');
      return of(this.getCartItemsLocal());
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

    if (!userId) {
      console.error('Usuario no autenticado');
      return of({ success: false, data: [] });
    }

    const body = { user_id: userId, product_id: productId, quantity };

    return this.http.post<any>(`${this.apiUrl}`, body).pipe(
      tap((response) => {
        // ✅ Solo guardar en localStorage si el backend respondió correctamente
        if (response && !response.error) {
          console.log('✅ Producto añadido correctamente al backend.');
          this.addCartItemLocal(productId, quantity);
        }
      }),
      catchError(err => {
        console.warn('⚠️ Error con backend, guardando en localStorage.');
        this.addCartItemLocal(productId, quantity);
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
      return of({ message: 'Producto eliminado del carrito local.' });
    }

    // ✅ Si hay usuario, eliminar desde backend
    const body = { item_id: itemId };

    return this.http.request<any>('delete', `${this.apiUrl}`, { body }).pipe(
      map(res => {
        // También eliminar del localStorage para mantener sincronizado
        this.removeCartItemLocal(itemId);
        return res;
      }),
      catchError(err => {
        console.warn('⚠️ Error al eliminar en backend, usando localStorage.', err);
        this.removeCartItemLocal(itemId);
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
      return of({ message: 'Cantidad actualizada en carrito local.' });
    }

    // 🔸 El backend espera "item_id", no "cart_item_id"
    const body = { user_id: userId, item_id: cartItemId, quantity: newQuantity };

    return this.http.put<any>(`${this.apiUrl}`, body).pipe(
      map(res => {
        // ✅ Si el backend responde correctamente, también actualizamos el localStorage
        this.updateCartItemQuantityLocal(cartItemId, newQuantity);
        return res;
      }),
      catchError(err => {
        console.warn('⚠️ Error al actualizar en backend, usando localStorage.', err);
        this.updateCartItemQuantityLocal(cartItemId, newQuantity);
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
}
