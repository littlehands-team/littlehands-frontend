// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProductService} from '../../../core/services/product.service';
import { Product} from '../../../shared/models/product.model';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  loading: boolean = true;
  error: boolean = false;

  // Para la imagen principal
  mainImageUrl: string = '';

  // Videos de YouTube embebidos
  youtubeEmbedUrls: SafeResourceUrl[] = [];
  selectedVideoIndex: number = 0;

  // Cantidad del producto
  quantity: number = 1;

  // Chatbot
  chatbotOpen: boolean = false;
  chatbotQuestion: string = '';

  // Preguntas frecuentes predefinidas
  frequentQuestions: string[] = [
    'What skills will I gain from this course?',
    'How do I create a basic Dockerfile?',
    'How does cleaning the local environment help Docker build?',
    'Take me to the lecture about Jenkins CI/CD pipelines'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Obtener el slug de la URL
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProduct(slug);
      } else {
        this.error = true;
        this.loading = false;
      }
    });
  }

  loadProduct(slug: string): void {
    this.loading = true;
    this.productService.getProductBySlug(slug).subscribe({
      next: (product) => {
        if (product) {
          this.product = product;
          this.mainImageUrl = product.image_url;
          this.processYoutubeLinks(product.youtube_links);
        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando producto:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  processYoutubeLinks(links: string[]): void {
    this.youtubeEmbedUrls = links.map(link => {
      const videoId = this.extractYoutubeVideoId(link);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    });
  }

  extractYoutubeVideoId(url: string): string {
    // Extraer ID de URLs como:
    // https://www.youtube.com/watch?v=dQw4w9WgXcQ
    // https://youtu.be/dQw4w9WgXcQ
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    }
    return '';
  }

  // Seleccionar video
  selectVideo(index: number): void {
    this.selectedVideoIndex = index;
  }

  // Control de cantidad
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  // Añadir al carrito
  addToCart(): void {
    if (!this.product) return;

    console.log(`Añadiendo ${this.quantity} unidad(es) de "${this.product.name}" al carrito`);
    // TODO: Implementar lógica del carrito
    alert(`${this.quantity} producto(s) añadido(s) al carrito`);
  }

  // Chatbot
  toggleChatbot(): void {
    this.chatbotOpen = !this.chatbotOpen;
  }

  selectQuestion(question: string): void {
    this.chatbotQuestion = question;
  }

  sendChatbotQuestion(): void {
    if (!this.chatbotQuestion.trim()) return;

    console.log('Pregunta enviada:', this.chatbotQuestion);
    // TODO: Implementar lógica del chatbot
    alert(`Pregunta: ${this.chatbotQuestion}`);
    this.chatbotQuestion = '';
  }

  // Calcular precio final
  get finalPrice(): number {
    if (!this.product) return 0;
    const discount = (this.product.price * this.product.discount_percentage) / 100;
    return this.product.price - discount;
  }

  // Verificar si tiene descuento
  get hasDiscount(): boolean {
    return this.product ? this.product.discount_percentage > 0 : false;
  }
}
