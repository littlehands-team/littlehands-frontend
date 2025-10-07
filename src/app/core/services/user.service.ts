import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';
import { User } from '../../shared/models/user.model';
import { RegisterRequest } from '../../shared/models/register-request.model';
import { catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { ApiResponse} from '../../shared/models/response.model';
import { CryptoService } from './crypto.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private crypto: CryptoService) {}

  // Registro
  register(data: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<User>(`${this.apiUrl}/users/register/`, data).pipe(
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

  // Login
  login(credentials: { email: string; password: string }): Observable<ApiResponse<{ token: string, user: User }>> {
    return this.http.post<any>(`${this.apiUrl}/users/login/`, credentials).pipe(
      map((response) => {
        if (response && response.token && response.user) {

          // Guardamos data en el localstorage
          const currentUser = { token: response.token, user: response.user };
          localStorage.setItem('mm-current-user', this.crypto.encrypt(currentUser));

          return {
            success: true,
            message: response.message || 'Login exitoso',
            data: {
              token: response.token,
              user: response.user
            }
          } as ApiResponse<{ token: string, user: User }>;
        }

        // Caso en el que backend solo devuelve un mensaje (ejemplo: credenciales inválidas)
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
  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/logout/`, {});
  }

  // Obtener lista de usuarios (solo prueba/admin)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/list/`);
  }
}
