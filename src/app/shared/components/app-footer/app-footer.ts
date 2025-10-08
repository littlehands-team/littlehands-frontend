import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app-footer.html',
  styleUrl: './app-footer.css'
})
export class AppFooter {

}
