import { Component } from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {Router, RouterLink} from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {UserService} from '../../../core/services/user.service';
import {NgToastService} from 'ng-angular-popup';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
    FormsModule,
    NgIf,
    MatIconModule,
  ],
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router,
              private userService: UserService, private toast: NgToastService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
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
          //localStorage.setItem('user', JSON.stringify(res.data?.user));
          this.router.navigate(['/']); // o '/home'
        } else {
          this.toast.danger(res.message, 'Error', 3000);
        }
      });
    }
  }

}
