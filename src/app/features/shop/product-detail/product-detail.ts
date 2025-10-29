// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProductService} from '../../../core/services/product.service';
import { Product} from '../../../shared/models/product.model';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {ChatService} from '../../../core/services/chat.service';
import {CartService} from '../../../core/services/cart.service';
import { Message} from '../../../shared/models/message.model';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule,MatIconModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  loading: boolean = true;
  error: boolean = false;

  // Productos recomendados
  recommendedProducts: Product[] = [];
  loadingRecommendations: boolean = false;

  // Para la imagen principal
  mainImageUrl: string = '';

  // Videos de YouTube embebidos
  youtubeEmbedUrls: SafeResourceUrl[] = [];
  selectedVideoIndex: number = -1;

  // Cantidad del producto
  quantity: number = 1;

  // Chatbot
  chatbotOpen: boolean = false;
  chatbotQuestion: string = '';

  // Mensajes del chat
  chatMessages: Message[] = [
    {
      text: 'Hola! ¿En qué puedo ayudarte?',
      isBot: true,
      timestamp: new Date()
    }
  ];
  isChatLoading = false;

  // 🧠 Opción especial para solicitar una guía Montessori personalizada
  suggestedMessages: string[] = [
    '🧩 Solicitar guía de uso Montessori personalizada'
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private sanitizer: DomSanitizer,
    private chatService: ChatService,
    private cartService: CartService,
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

  selectSuggestedMessage(message: string): void {
    this.chatbotQuestion = message;
    this.sendChatbotQuestion();
  }

  sendChatbotQuestion(): void {
    if (!this.chatbotQuestion.trim()) return;

    if (!this.product) {
      console.error('No hay producto cargado');
      return;
    }

    // Agregar mensaje del usuario
    this.chatMessages.push({
      text: this.chatbotQuestion,
      isBot: false,
      timestamp: new Date()
    });

    const userQuestion = this.chatbotQuestion;
    this.chatbotQuestion = '';
    this.isChatLoading = true;

    // Scroll al final
    this.scrollChatToBottom();

    this.chatService.sendProductMessage(userQuestion, this.chatMessages, this.product).subscribe({
      next: (botResponse) => {
        this.isChatLoading = false;
        this.chatMessages.push({
          text: botResponse,
          isBot: true,
          timestamp: new Date()
        });
        this.scrollChatToBottom();
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        this.isChatLoading = false;
        this.chatMessages.push({
          text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.',
          isBot: true,
          timestamp: new Date()
        });
        this.scrollChatToBottom();
      }
    });
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  formatBotMessage(msg: Message): string {
    // Si es mensaje del usuario, mostrar texto plano
    if (!msg.isBot) return msg.text;

    // 🔹 Convertir Markdown básico a HTML
    let formatted = msg.text
      // Negrita: **texto**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Cursiva: *texto*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Saltos de línea (\n o \r\n)
      .replace(/\n/g, '<br>');

    // 🔹 Escapar etiquetas HTML no deseadas (básico)
    formatted = formatted.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    formatted = formatted
      .replace(/&lt;(\/?(?:strong|em|br))&gt;/g, '<$1>'); // permite solo estas etiquetas

    return formatted;
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
    this.loadRecommendedProduct(slug)
  }

  loadRecommendedProduct(slug: string): void {
    this.loadingRecommendations = true;
    this.recommendedProducts = [];

    this.productService.getRecommendedProducts(slug).subscribe({
      next: (products) => {
        this.recommendedProducts = products;
        this.loadingRecommendations = false;
      },
      error: (err) => {
        console.error('Error cargando productos recomendados:', err);
        this.loadingRecommendations = false;
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

  addToCartMain(): void {
    if (!this.product?.id) {
      console.error('❌ No se encontró el ID del producto.');
      return;
    }

    const productId = Number(this.product.id); // asegura que sea número

    this.cartService.addCartItem(productId, this.quantity).subscribe({
      next: (res) => {
        console.log(res.message);
        alert(res.message);
      },
      error: (err) => {
        console.error('Error al agregar al carrito:', err);
        alert('Hubo un problema al añadir al carrito.');
      }
    });
  }

  // Navegación
  viewProductDetail(product: Product) {
    this.router.navigate(['/tienda/producto', product.slug]);
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

  addToCart(event: Event, product: Product) {
    if (!product?.id) { // <- corregido
      console.error('❌ No se encontró el ID del producto.');
      return;
    }

    const productId = Number(product.id); // asegura que sea número

    this.cartService.addCartItem(productId, 1).subscribe({
      next: (res) => {
        console.log(res.message);
        alert(res.message);
      },
      error: (err) => {
        console.error('Error al agregar al carrito:', err);
        alert('Hubo un problema al añadir al carrito.');
      }
    });
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
