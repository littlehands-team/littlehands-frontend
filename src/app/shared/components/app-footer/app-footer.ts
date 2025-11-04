import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {Product} from '../../models/product.model';

@Component({
  selector: 'app-app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app-footer.html',
  styleUrl: './app-footer.css'
})
export class AppFooter {

  handleContact(): void {
    const message = `Hola! Me gustaría obtener más información sobre sus productos y servicios. ¿Podrían ayudarme, por favor? Gracias.`;
    const whatsappUrl = `https://wa.me/51904205500?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

}
