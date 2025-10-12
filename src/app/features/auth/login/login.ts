import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user.service';
import { NgToastService } from 'ng-angular-popup';
import { CryptoService } from '../../../core/services/crypto.service';

interface RememberMeData {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    RouterLink,
    FormsModule,
    NgIf,
    MatIconModule,
  ],
  styleUrl: './login.css'
})
export class Login implements OnInit {
  loginForm: FormGroup;
  private readonly REMEMBER_ME_KEY = 'lh-remember-me';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private toast: NgToastService,
    private cryptoService: CryptoService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    this.loadRememberedCredentials();
  }

  loadRememberedCredentials() {
    const encryptedData = localStorage.getItem(this.REMEMBER_ME_KEY);

    if (encryptedData) {
      const rememberedData = this.cryptoService.decrypt<RememberMeData>(encryptedData);

      if (rememberedData && rememberedData.rememberMe) {
        this.loginForm.patchValue({
          email: rememberedData.email,
          password: rememberedData.password,
          rememberMe: true
        });
      }
    }
  }

  saveRememberMeCredentials(email: string, password: string, rememberMe: boolean) {
    if (rememberMe) {
      const dataToSave: RememberMeData = {
        email: email,
        password: password,
        rememberMe: true
      };

      const encryptedData = this.cryptoService.encrypt(dataToSave);
      localStorage.setItem(this.REMEMBER_ME_KEY, encryptedData);
    } else {
      // Si no marca "Recuérdame", borramos los datos guardados
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  onLogin() {
    if (this.loginForm.valid) {
      const formValue = this.loginForm.value;

      const credentials = {
        email: formValue.email.toLowerCase(),
        password: formValue.password
      };

      this.userService.login(credentials).subscribe((res) => {
        if (res.success) {
          console.log('Login exitoso ✅');

          // Guardar o eliminar credenciales según "Recuérdame"
          this.saveRememberMeCredentials(
            formValue.email,
            formValue.password,
            formValue.rememberMe
          );

          this.toast.success('Bienvenido', 'Login exitoso', 3000);
          this.router.navigate(['/']);
        } else {
          this.toast.danger(res.message, 'Error', 3000);
        }
      });
    }
  }
}
