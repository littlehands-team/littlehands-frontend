import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { RegisterRequest } from '../../../shared/models/register-request.model';
import {NgToastComponent, NgToastService} from 'ng-angular-popup';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    NgToastComponent
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private toast: NgToastService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
    this.toast.success("response.message", 'Registro exitoso', 3000);
    console.log("AAAAAAAAAAAAAAAAAAAAAAA")
  }

  passwordMatchValidator(formGroup: AbstractControl) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword');

    if (password !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
      return null;
    }
  }

  onRegister(): void {
    if (this.registerForm.hasError('passwordMismatch')) {
      this.registerForm.get('confirmPassword')?.markAsTouched();
      return;
    }

    if (this.registerForm.valid) {
      const formData = this.registerForm.value;

      const registerRequest: RegisterRequest = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email.toLowerCase(),
        password: formData.password,
      };

      console.log('Payload para API:', registerRequest);

      this.userService.register(registerRequest).subscribe((response) => {
        if (response.success) {
          this.toast.success(response.message, 'Registro exitoso', 3000);
          this.router.navigate(['/auth/login']);
        } else {
          this.toast.danger(response.message, 'Error', 3000);
        }
      });
    }
  }
}
