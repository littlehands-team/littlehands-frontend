import { Component } from '@angular/core';
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
export class AppNavbar {
  cartItemsCount = 3; // Esto debería venir de un servicio
  menuOpened = false;
  searchQuery = '';

  constructor(private router: Router) { }

  onSearch() {
    console.log('Buscando:', this.searchQuery);
    // Implementar lógica de búsqueda
  }

  goToAccount() {
    this.router.navigate(['/auth/login']);
  }

  goToCart() {
    console.log('Ir al carrito');
    // Navegar al carrito
  }

  toggleMenu() {
    console.log('Buscando:', this.menuOpened);
    this.menuOpened = !this.menuOpened;
  }

  closeMenu() {
    this.menuOpened = false;
  }
}
