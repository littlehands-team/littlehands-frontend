import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';
import { User } from '../../shared/models/user.model';
import { RegisterRequest } from '../../shared/models/register-request.model';
import { catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { ApiResponse} from '../../shared/models/response.model';
import { CryptoService } from './crypto.service';
import {CartService} from './cart.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private crypto: CryptoService, private cartService: CartService) {}

  // Registro
  register(data: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<User>(`${this.apiUrl}/register/`, data).pipe(
      map((user) => ({
        success: true,
        message: 'Registro exitoso',
        data: user
      })),
      catchError((error) =>
        of({
          success: false,
          message: error.error?.message || 'Error en el registro',
          data: undefined
        })
      )
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<{ token: string, user: User }>> {
    return this.http.post<any>(`${this.apiUrl}/login/`, credentials).pipe(
      map((response) => {
        if (response && response.token && response.user) {

          // Guardamos usuario autenticado
          const currentUser = { token: response.token, user: response.user };
          localStorage.setItem('hh-current-user', this.crypto.encrypt(currentUser));

          // ✅ Guardamos carrito autenticado
          if (response.cart_items) {
            localStorage.setItem('hh-auth-cart-items', JSON.stringify(response.cart_items));
          }

          // ✅ Sincronizamos el contador del carrito
          this.cartService.syncCartCount();

          return {
            success: true,
            message: response.message || 'Login exitoso',
            data: {
              token: response.token,
              user: response.user
            }
          } as ApiResponse<{ token: string, user: User }>;
        }

        // Si backend devuelve solo mensaje de error
        return {
          success: false,
          message: response.message || 'Credenciales inválidas'
        } as ApiResponse<{ token: string, user: User }>;
      }),
      catchError((error) =>
        of({
          success: false,
          message: error?.error?.message || 'Error en el login'
        } as ApiResponse<{ token: string, user: User }>)
      )
    );
  }


  // Logout
  logout(): void {
    localStorage.removeItem('hh-current-user');
    localStorage.removeItem('hh-auth-cart-items');
    this.cartService.syncCartCount();
  }

  // Obtener lista de usuarios (solo prueba/admin)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/list/`);
  }
}
