import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {CryptoService} from '../../../core/services/crypto.service';
import {CartService} from '../../../core/services/cart.service';


@Component({
  selector: 'app-app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatBadgeModule,
    FormsModule
  ],
  templateUrl: './app-navbar.html',
  styleUrl: './app-navbar.css'
})
export class AppNavbar implements OnInit {
  cartItemsCount = 0;
  menuOpened = false;
  searchQuery = '';

  constructor(private router: Router, private cryptoService: CryptoService,
              private cartService: CartService) { }

  ngOnInit(): void {
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemsCount = count;
    });

    // 👇 Esto sincroniza el valor inicial (por si se recarga la página)
    this.cartService.syncCartCount();
  }


  onSearch() {
    console.log('Buscando:', this.searchQuery);
    // Implementar lógica de búsqueda
  }

  goToAccount() {
    if(this.cryptoService.isUserLogged()){
      this.router.navigate(['/perfil']);
    }else {
      this.router.navigate(['/auth/login']);
    }

  }

  goToCart() {
    this.router.navigate(['/carrito']);
  }

  isUserLogged(): boolean {
    const user = localStorage.getItem('hh-current-user');
    return !!user; // retorna true si existe, false si no
  }

  toggleMenu() {
    console.log('Buscando:', this.menuOpened);
    this.menuOpened = !this.menuOpened;
  }

  closeMenu() {
    this.menuOpened = false;
  }
}
