import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {AppNavbar} from './shared/components/app-navbar/app-navbar';
import {AppFooter} from './shared/components/app-footer/app-footer';
import {FloatingChat} from './shared/components/floating-chat/floating-chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar, AppFooter, FloatingChat ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Littlehands');
}
