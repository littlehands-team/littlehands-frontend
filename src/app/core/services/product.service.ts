import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';
import { Product } from '../../shared/models/product.model';
import { User } from '../../shared/models/user.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private crypto: CryptoService) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/`).pipe(
      catchError((error) => {
        console.error('Error al obtener productos:', error);
        return of([]);
      })
    );
  }

  createProduct(product: Product): Observable<Product | null> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      console.error('❌ Usuario no autenticado');
      return of(null);
    }

    // Enviar solo los IDs, el backend devolverá los objetos completos
    const payload = {
      ...product,
      added_by: userId,
      updated_by: userId,
    };

    return this.http.post<Product>(`${this.apiUrl}/`, payload).pipe(
      map((newProduct) => ({
        ...newProduct,
      })),
      catchError((error) => {
        console.error('Error al crear producto:', error);
        return of(null);
      })
    );
  }

  updateProduct(id: number, product: Product): Observable<Product | null> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      console.error('❌ Usuario no autenticado');
      return of(null);
    }

    const payload = {
      ...product,
      updated_by: userId,
    };

    return this.http.patch<Product>(`${this.apiUrl}/${id}/`, payload).pipe(
      map((updatedProduct) => ({
        ...updatedProduct,
      })),
      catchError((error) => {
        console.error(`Error al actualizar producto con ID ${id}:`, error);
        return of(null);
      })
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      console.error('❌ Usuario no autenticado');
      return of(false);
    }

    const body = { updated_by: userId };

    return this.http.delete(`${this.apiUrl}/products/${id}/delete/`, { body }).pipe(
      map(() => true),
      catchError((error) => {
        console.error(`Error al eliminar producto con ID ${id}:`, error);
        return of(false);
      })
    );
  }

  toggleProductStatus(id: number): Observable<Product | null> {
    const userId = this.crypto.getCurrentUserId();

    if (!userId) {
      console.error('❌ Usuario no autenticado');
      return of(null);
    }

    const payload = {
      updated_by: userId,
    };

    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/toggle-active/`, payload).pipe(
      catchError((error) => {
        console.error(`Error al cambiar estado de producto ${id}:`, error);
        return of(null);
      })
    );
  }
}
