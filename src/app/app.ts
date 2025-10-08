import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {AppNavbar} from './shared/components/app-navbar/app-navbar';
import {AppFooter} from './shared/components/app-footer/app-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar, AppFooter  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('littlehands');
}
