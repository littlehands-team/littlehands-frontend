import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { Message} from '../../models/message.model';

@Component({
  selector: 'app-floating-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './floating-chat.html',
  styleUrl: './floating-chat.css'
})
export class FloatingChat {
  isOpen = false;
  userMessage = '';
  isLoading = false;
  messages: Message[] = [
    {
      text: 'Hola! ¿En qué puedo ayudarte?',
      isBot: true,
      timestamp: new Date()
    }
  ];

  constructor(private chatService: ChatService) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (this.userMessage.trim() && !this.isLoading) {
      const userMsg = this.userMessage;

      // Agregar mensaje del usuario
      this.messages.push({
        text: userMsg,
        isBot: false,
        timestamp: new Date()
      });

      this.userMessage = '';
      this.isLoading = true;

      // Llamar al servicio de chat
      this.chatService.sendMessage(userMsg, this.messages).subscribe({
        next: (botResponse) => {
          this.messages.push({
            text: botResponse,
            isBot: true,
            timestamp: new Date()
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al enviar mensaje:', error);
          this.messages.push({
            text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.',
            isBot: true,
            timestamp: new Date()
          });
          this.isLoading = false;
        }
      });
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
