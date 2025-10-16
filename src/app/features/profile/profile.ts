import {Component, inject, OnInit, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Router } from '@angular/router';
import {CryptoService} from '../../core/services/crypto.service';
import { User } from '../../shared/models/user.model';
import { Product } from '../../shared/models/product.model';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';


interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  items: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatDialogModule, MatTooltipModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  activeSection: 'orders' | 'account' | 'admin-orders' | 'products' = 'account';

  products: Product[] = [];
  displayedColumns: string[] = ['name', 'price', 'discount', 'finalPrice', 'status', 'actions'];

  userInfo: User | null = null;

  orders: Order[] = [
    {
      id: '#12345',
      date: '15 de Octubre, 2025',
      total: 150.50,
      status: 'completed',
      items: 3
    },
    {
      id: '#12344',
      date: '10 de Octubre, 2025',
      total: 89.99,
      status: 'pending',
      items: 2
    },
    {
      id: '#12343',
      date: '5 de Octubre, 2025',
      total: 200.00,
      status: 'completed',
      items: 5
    }
  ];

  private _snackBar = inject(MatSnackBar);

  constructor(private router: Router, private productService: ProductService,
              private cryptoService: CryptoService, private dialog: MatDialog, ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadProducts();
  }

  private loadUserData(): void {
    const encryptedUser = localStorage.getItem('hh-current-user');

    if (encryptedUser) {
      const decryptedData = this.cryptoService.decrypt<any>(encryptedUser);

      if (decryptedData && decryptedData.user) {
        this.userInfo = decryptedData.user;
      } else {
        console.error('Estructura inválida o no se pudo desencriptar el usuario');
      }
    } else {
      console.warn('No se encontró hh-current-user en localStorage');
    }
  }

  loadProducts() {
    this.productService.getProducts().subscribe((products) => {
      this.products = products;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateDisplayedColumns(event.target.innerWidth);
  }

  updateDisplayedColumns(width: number) {
    if (width < 680) {
      // Ocultamos algunas columnas en pantallas pequeñas
      this.displayedColumns = ['name', 'price', 'actions'];
    } else if (width < 900) {
      // Muestra algunas adicionales
      this.displayedColumns = ['name', 'price', 'discount', 'actions'];
    } else {
      // Versión completa
      this.displayedColumns = ['name', 'price', 'discount', 'finalPrice', 'status', 'actions'];
    }
  }

  calculateFinalPrice(product: Product): number {
    if (product.discount_percentage > 0) {
      const discount = (product.price * product.discount_percentage) / 100;
      return product.price - discount;
    }
    return product.price;
  }

  openProductDialog(product?: Product) {
    /*const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: product ? { ...product } : null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProducts();
      }
    });*/
  }

  viewProduct(product: Product) {
    /*this.dialog.open(ProductViewDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: product
    });*/
  }

  editProduct(product: Product) {
    this.openProductDialog(product);
  }

  toggleProductStatus(product: Product) {
    const newStatus = !product.is_active;
    const updatedProduct = { ...product, is_active: newStatus };

    this.productService.updateProduct(product.id!, updatedProduct).subscribe((result) => {
      if (result) {
        this._snackBar.open(`Producto ${newStatus ? 'activado' : 'desactivado'} exitosamente`, 'Cerrar',{
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 3000,
        });
        this.loadProducts();
      } else {
        this._snackBar.open('Error al cambiar estado del producto', 'Cerrar',{
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 3000,
        });
      }
    });
  }

  deleteProduct(product: Product) {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
      this.productService.deleteProduct(product.id!).subscribe((success) => {
        if (success) {
          this._snackBar.open('Producto eliminado exitosamente', 'Cerrar',{
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
          });
          this.loadProducts();
        } else {
          this._snackBar.open('Error al eliminar el producto', 'Cerrar',{
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
          });
        }
      });
    }
  }

  setActiveSection(section: 'orders' | 'account' | 'admin-orders' | 'products'): void {
    this.activeSection = section;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  onEdit(): void {
    console.log('Editar información');
    // Implementar lógica de edición
  }

  onChangePassword(): void {
    console.log('Cambiar contraseña');
    // Implementar lógica de cambio de contraseña
  }

  logOut() {
    //this.userService.logout()
    // Limpia el token
    localStorage.removeItem('hh-current-user');

    // Redirigir al login
    this.router.navigate(['/auth/login']);
  }
}
