import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  activeSection: 'orders' | 'account' = 'account';

  userInfo = {
    firstName: 'Diego',
    lastName: 'Talledo',
    email: 'diegotasa6@gmail.com'
  };

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

  setActiveSection(section: 'orders' | 'account'): void {
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
}
