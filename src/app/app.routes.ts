import { Routes } from '@angular/router';
import {Profile} from './features/profile/profile';
import {Shop} from './features/shop/shop';
import {About} from './features/about/about';
import {Login} from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Cart } from './features/cart/cart';

export const routes: Routes = [
  { path: 'tienda', component: Shop },
  { path: 'perfil', component: Profile },
  { path: 'nosotros', component: About },
  { path: 'carrito', component: Cart },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: '', redirectTo: 'nosotros', pathMatch: 'full' }, // default después del login
];
