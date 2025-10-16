// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProductService} from '../../../core/services/product.service';
import { Product} from '../../../shared/models/product.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Mensajes del chat
  chatMessages: Array<{text: string, isUser: boolean, timestamp: Date}> = [];

  // Mensajes sugeridos predefinidos
  suggestedMessages: string[] = [
    '¿Es seguro para niños pequeños?',
    '¿Qué habilidades desarrolla este juguete?'
  ];

  // Respuestas genéricas del bot
  private botResponses: string[] = [
    'Este juguete está diseñado siguiendo los principios Montessori, fomentando el aprendizaje autónomo y la creatividad de los niños.',
    'Todos nuestros productos están fabricados con materiales naturales y no tóxicos, seguros para los más pequeños.',
    'Este juguete ayuda a desarrollar la motricidad fina, coordinación ojo-mano y resolución de problemas.',
    'Recomendamos supervisión de un adulto durante el juego, especialmente para niños menores de 3 años.',
    'La edad recomendada está indicada en la ficha del producto. Cada juguete está diseñado para un rango de edad específico.',
    'Nuestros juguetes de madera son duraderos y pueden limpiarse con un paño húmedo. Evitar sumergir en agua.',
    'Todos nuestros productos cumplen con las normativas europeas de seguridad EN71.',
    'El envío suele tardar entre 3-5 días laborables dentro de la península.'
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

  selectSuggestedMessage(message: string): void {
    this.chatbotQuestion = message;
    this.sendChatbotQuestion();
  }

  sendChatbotQuestion(): void {
    if (!this.chatbotQuestion.trim()) return;

    // Agregar mensaje del usuario
    this.chatMessages.push({
      text: this.chatbotQuestion,
      isUser: true,
      timestamp: new Date()
    });

    const userQuestion = this.chatbotQuestion;
    this.chatbotQuestion = '';

    // Simular "escribiendo..." y respuesta del bot después de 1 segundo
    setTimeout(() => {
      const randomResponse = this.botResponses[Math.floor(Math.random() * this.botResponses.length)];
      this.chatMessages.push({
        text: randomResponse,
        isUser: false,
        timestamp: new Date()
      });

      // Scroll al final del chat
      this.scrollChatToBottom();
    }, 1000);
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
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
