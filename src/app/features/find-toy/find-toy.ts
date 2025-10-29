// find-toy.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import {ChatService} from '../../core/services/chat.service';
import { Product } from '../../shared/models/product.model';
import {Message} from '../../shared/models/message.model';
import {Answers} from '../../shared/models/Answers.model';

interface Question {
  id: string;
  question: string;
  options: string[];
  emoji: string;
}

@Component({
  selector: 'app-find-toy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './find-toy.html',
  styleUrl: './find-toy.css'
})
export class FindToy implements OnInit {
  step: number = 0; // 0 = inicio, 1-5 = preguntas, 6 = chat

  answers: Answers = {
    gender: '',
    age: '',
    activityLevel: '',
    skill: '',
    learningStyle: ''
  };

  chatMessages: Message[] = [];
  userMessage: string = '';
  isTyping: boolean = false;

  // Preguntas del formulario
  questions: Question[] = [
    {
      id: 'gender',
      question: '¿Para quién es el juguete?',
      options: ['Niño', 'Niña', 'Cualquiera'],
      emoji: '👶'
    },
    {
      id: 'age',
      question: '¿Qué edad tiene?',
      options: ['0-2 años', '3-5 años', '6-8 años', '9+ años'],
      emoji: '🎂'
    },
    {
      id: 'activityLevel',
      question: '¿Qué tipo de juego prefiere?',
      options: ['Activo y dinámico', 'Tranquilo y creativo', 'Mixto'],
      emoji: '⚡'
    },
    {
      id: 'skill',
      question: '¿Qué habilidad quieres desarrollar?',
      options: ['Motricidad fina', 'Creatividad', 'Lógica', 'Coordinación'],
      emoji: '🎨'
    },
    {
      id: 'learningStyle',
      question: '¿Cómo aprende mejor?',
      options: ['Observando', 'Tocando y probando', 'Imaginando', 'Repitiendo'],
      emoji: '🧩'
    }
  ];

  constructor(
    private router: Router,
    private productService: ProductService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  handleStart(): void {
    this.step = 1;
  }

  handleAnswer(questionId: string, answer: string): void {
    this.answers = { ...this.answers, [questionId]: answer };

    if (this.step < this.questions.length) {
      setTimeout(() => {
        this.step++;
      }, 300);
    } else {
      setTimeout(() => {
        console.log('📤 Respuestas finales del usuario:', this.answers); // ✅ verifica aquí
        this.step = 6;
        this.initializeChat();
      }, 500);
    }
  }

  initializeChat(): void {
    const initialMessage: Message = {
      text: `¡Perfecto! Basándome en tus respuestas, puedo ayudarte a encontrar el juguete ideal 🎁 ¿Quieres que te muestre algunas opciones?`,
      isBot: true,
      timestamp: new Date()
    };
    this.isTyping = false;

    this.chatMessages = [initialMessage];
  }

  formatBotMessage(msg: Message): string {
    if (!msg.isBot) return msg.text;

    // Convierte Markdown básico (**texto**) en <strong>
    let formatted = msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // negrita
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // cursiva opcional

    // Escapa cualquier HTML peligroso
    return formatted;
  }

  handleSendMessage(): void {
    if (!this.userMessage.trim()) return;

    // Agregar mensaje del usuario
    const newMessage: Message = {
      text: this.userMessage,
      isBot: false,
      timestamp: new Date()
    };
    this.chatMessages.push(newMessage);

    const messageText = this.userMessage;
    this.userMessage = '';

    // ← ACTIVAR indicador de "escribiendo"
    this.isTyping = true;
    this.scrollToBottom();

    // Llamar al backend Gemini
    this.chatService
      .sendRecommendToyMessage(messageText, this.chatMessages, this.answers)
      .subscribe({
        next: (response: any) => {
          this.isTyping = false;
          let botText: string = '';
          let productsFromAI: Product[] = [];

          // 🔹 Si la API devolvió directamente un objeto con productos
          if (response && response.products) {
            botText = response.botMessage || 'Aquí tienes mis recomendaciones:';
            productsFromAI = response.products;
          } else {
            botText = response.botMessage || response || '';

            // 🔹 Detectar si el texto contiene un bloque JSON
            const jsonMatch = botText.match(/```json([\s\S]*?)```/);
            if (jsonMatch) {
              try {
                const jsonText = jsonMatch[1].trim();
                productsFromAI = JSON.parse(jsonText);

                // Elimina el bloque JSON del texto mostrado al usuario
                botText = botText.replace(/```json[\s\S]*?```/, '').trim();
              } catch (e) {
                console.error('Error al parsear productos JSON:', e);
              }
            }
          }

          // 🔹 Crear mensaje del bot CON productos embebidos
          const botResponse: Message = {
            text: botText || 'Aquí tienes mis recomendaciones basadas en tus respuestas:',
            isBot: true,
            timestamp: new Date(),
            products: productsFromAI.length > 0 ? productsFromAI : undefined // ← NUEVO
          };

          this.chatMessages.push(botResponse);
          this.scrollToBottom();
        },
        error: (err) => {
          this.isTyping = false;
          console.error('Error comunicando con IA:', err);
          const errorResponse: Message = {
            text: 'Lo siento, tuve un problema al procesar tu mensaje. Intenta de nuevo. 😔',
            isBot: true,
            timestamp: new Date()
          };
          this.chatMessages.push(errorResponse);
          this.scrollToBottom();
        }
      });
  }

  handleProductClick(product: Product): void {
    if (product.is_active) {
      // Redirigir al producto activo en la tienda
      this.router.navigate(['/tienda/producto', product.slug]);
    } else {
      // Abrir WhatsApp para productos inactivos
      const message = `Hola 👋, estoy interesado en el producto: ${product.name}`;
      const whatsappUrl = `https://wa.me/51997311387?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  calculateFinalPrice(product: Product): string {
    if (product.discount_percentage > 0) {
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      const discount = (price * product.discount_percentage) / 100;
      const final = price - discount;
      return final.toFixed(2);
    }
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    return price.toFixed(2);
  }

  getProgressPercentage(): number {
    if (this.step === 0 || this.step === 6) return 0;
    return (this.step / this.questions.length) * 100;
  }

  getCurrentQuestion(): Question | null {
    if (this.step >= 1 && this.step <= this.questions.length) {
      return this.questions[this.step - 1];
    }
    return null;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.handleSendMessage();
    }
  }
}
