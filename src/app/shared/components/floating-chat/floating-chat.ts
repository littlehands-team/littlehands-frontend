import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

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
  messages: Message[] = [
    {
      text: 'Hola! Soy Alma. Antes de ayudarte, por favor ingresa tu DNI.',
      isBot: true,
      timestamp: new Date()
    }
  ];

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (this.userMessage.trim()) {
      // Agregar mensaje del usuario
      this.messages.push({
        text: this.userMessage,
        isBot: false,
        timestamp: new Date()
      });

      const userMsg = this.userMessage.toLowerCase();
      this.userMessage = '';

      // Simular respuesta del bot
      setTimeout(() => {
        let botResponse = '';

        if (userMsg.match(/^\d{8}$/)) {
          botResponse = 'Gracias por proporcionar tu DNI. ¿En qué puedo ayudarte hoy?';
        } else if (userMsg.includes('horario') || userMsg.includes('hora')) {
          botResponse = 'Nuestro horario de atención es de Lunes a Viernes de 8:00 AM a 6:00 PM.';
        } else if (userMsg.includes('pedido') || userMsg.includes('orden')) {
          botResponse = 'Puedes revisar tus pedidos en la sección "Mis Pedidos" de tu cuenta.';
        } else if (userMsg.includes('ayuda') || userMsg.includes('hola')) {
          botResponse = '¡Hola! Estoy aquí para ayudarte. ¿Qué necesitas?';
        } else {
          botResponse = 'Entiendo. Un representante se comunicará contigo pronto. ¿Hay algo más en lo que pueda ayudarte?';
        }

        this.messages.push({
          text: botResponse,
          isBot: true,
          timestamp: new Date()
        });
      }, 1000);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
