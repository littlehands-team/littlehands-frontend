import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../shared/models/product.model';
import { PriceRange } from '../../shared/models/product-shop-response.model';
import { AgeCategory, AGE_CATEGORY_ORDER} from '../../shared/enums/age.enum';


@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class Shop implements OnInit {
  products: Product[] = [];
  totalProducts: number = 0;
  hasMore: boolean = false;
  loading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  // Filtros
  priceRange: PriceRange = { min: 0, max: 1000 };
  filters = {
    minPrice: 0,
    maxPrice: 1000,
    selectedAges: [] as string[],
    search: ''
  };

  // UI States
  priceFilterOpen: boolean = true;
  ageFilterOpen: boolean = true;
  showAllAges: boolean = true;
  sortBy: string = 'recent';

  // Categorías de edad
  ageCategories: string[] = AGE_CATEGORY_ORDER;

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const search = params['search'] || '';
      this.filters.search = search;
      this.currentPage = 1;
      this.loadProducts(false);
    });
  }

  loadProducts(append: boolean = false) {
    this.loading = true;

    const minPrice = this.filters.minPrice > 0 ? this.filters.minPrice : undefined;
    const maxPrice = this.filters.maxPrice < this.priceRange.max ? this.filters.maxPrice : undefined;
    const ages = this.filters.selectedAges.length > 0 ? this.filters.selectedAges : undefined;

    this.productService.getShopProducts(
      this.currentPage,
      this.pageSize,
      minPrice,
      maxPrice,
      ages,
      this.filters.search
    ).subscribe((response) => {
      this.loading = false;

      if (response) {
        if (append) {
          this.products = [...this.products, ...response.products];
        } else {
          this.products = response.products;
        }

        this.totalProducts = response.total_products;
        this.hasMore = response.has_more;

        if (this.currentPage === 1) {
          const min = Math.floor(Number(response.price_range.min));
          const max = Math.ceil(Number(response.price_range.max));

          this.priceRange = { min, max };

          // Solo actualizar el maxPrice si el usuario no ha establecido uno manualmente
          if (this.filters.maxPrice === 1000 || this.filters.maxPrice > max) {
            this.filters.maxPrice = max;
          }
        }


      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadProducts(false);
  }

  loadMore() {
    this.currentPage++;
    this.loadProducts(true);
  }

  clearFilters() {
    this.filters = {
      minPrice: 0,
      maxPrice: this.priceRange.max,
      selectedAges: [],
      search: ''
    };
    this.applyFilters();
  }

  // Filtro de edad
  toggleAge(age: string) {
    const index = this.filters.selectedAges.indexOf(age);
    if (index > -1) {
      this.filters.selectedAges.splice(index, 1);
    } else {
      this.filters.selectedAges.push(age);
    }
    this.applyFilters();
  }

  isAgeSelected(age: string): boolean {
    return this.filters.selectedAges.includes(age);
  }

  // Toggle filters
  togglePriceFilter() {
    this.priceFilterOpen = !this.priceFilterOpen;
  }

  toggleAgeFilter() {
    this.ageFilterOpen = !this.ageFilterOpen;
  }

  // Ordenamiento
  onSortChange() {
    switch (this.sortBy) {
      case 'price-asc':
        // Precio: menor a mayor (precio final)
        this.products.sort((a, b) => {
          const priceA = parseFloat(this.calculateFinalPrice(a));
          const priceB = parseFloat(this.calculateFinalPrice(b));
          return priceA - priceB;
        });
        break;

      case 'price-desc':
        // Precio: mayor a menor (precio final)
        this.products.sort((a, b) => {
          const priceA = parseFloat(this.calculateFinalPrice(a));
          const priceB = parseFloat(this.calculateFinalPrice(b));
          return priceB - priceA;
        });
        break;

      case 'recent':
      default:
        // Más recientes (por created_at)
        this.products.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
    }
  }

  // Calcular precio final
  calculateFinalPrice(product: Product): string {
    if (product.discount_percentage > 0) {
      const discount = (parseFloat(product.price.toString()) * product.discount_percentage) / 100;
      const final = parseFloat(product.price.toString()) - discount;
      return final.toFixed(2);
    }
    return parseFloat(product.price.toString()).toFixed(2);
  }

  // Navegación
  viewProductDetail(product: Product) {
    this.router.navigate(['/tienda/producto', product.slug]);
  }

  addToCart(event: Event, product: Product) {
    event.stopPropagation(); // Evitar que se active el click del card
    console.log('Agregar al carrito:', product);
    // TODO: Implementar lógica de carrito
  }
}
