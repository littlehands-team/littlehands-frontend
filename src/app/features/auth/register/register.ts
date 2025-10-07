import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import 'moment/locale/es';
import {UserService} from '../../../core/services/user.service';
import {RegisterRequest} from '../../../shared/models/register-request.model';
import {NgToastService} from 'ng-angular-popup';


@Component({
  selector: 'app-register',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    provideNativeDateAdapter()
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    RouterLink,
    MatDatepickerModule,
    MatMomentDateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  currentStep: number = 1;

  constructor(private fb: FormBuilder, private router: Router, private userService: UserService, private toast: NgToastService) {
    this.registerForm = this.fb.group({
      // Paso 1: Información Personal
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],

      // Paso 2: Información Financiera
      currentMoney: ['', [Validators.required, Validators.min(0)]],
      monthlyIncome: [''],
      preferNotToSayIncome: [false],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(formGroup: AbstractControl) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword');

    if (password !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Limpia error si ya coinciden
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
      return null;
    }
  }

  // Navegación entre pasos
  nextStep(): void {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    this.currentStep = 1;
  }

  // Validaciones de pasos
  isStep1Valid(): boolean {
    const step1Fields = ['firstName', 'lastName', 'birthDate', 'gender', 'email'];
    return step1Fields.every(field => {
      const control = this.registerForm.get(field);
      return control && control.valid;
    });
  }

  isStep2Valid(): boolean {
    const currentMoneyValid = this.registerForm.get('currentMoney')?.valid ?? false;
    const passwordValid = this.registerForm.get('password')?.valid ?? false;
    const confirmPasswordValid = this.registerForm.get('confirmPassword')?.valid ?? false;
    const passwordsMatch = !this.registerForm.hasError('passwordMismatch');

    return currentMoneyValid && passwordValid && confirmPasswordValid;
  }


  // Manejo del checkbox de ingresos
  onIncomePreferenceChange(event: any): void {
    const monthlyIncomeControl = this.registerForm.get('monthlyIncome');
    if (event.checked) {
      // Si prefiere no decir, limpia y desactiva el campo
      monthlyIncomeControl?.setValue('');
      monthlyIncomeControl?.clearValidators();
    } else {
      // Si quiere especificar, reactiva el campo (opcional)
      monthlyIncomeControl?.setValidators([]);
    }
    monthlyIncomeControl?.updateValueAndValidity();
  }

  // Envío del formulario
  onRegister(): void {
    if (this.currentStep === 2) {
      // Verifica contraseñas
      if (this.registerForm.hasError('passwordMismatch')) {
        console.log("Contraseñas no iguales");
        this.registerForm.get('confirmPassword')?.markAsTouched();
        this.registerForm.get('confirmPassword')?.updateValueAndValidity();
        return;
      }

      // Verifica si el formulario es válido
      if (this.registerForm.valid) {
        console.log("ejecutando register");

        const formData = { ...this.registerForm.value };

        // Si prefiere no decir ingresos, elimina el campo
        if (formData.preferNotToSayIncome) {
          delete formData.monthlyIncome;
        }

        // Formatea fecha y calcula edad
        const birthDate = new Date(formData.birthDate);
        const formattedDate = birthDate.toISOString().split('T')[0];
        const today = new Date();
        const age =
          today.getFullYear() - birthDate.getFullYear() -
          (today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

        // Construye el objeto RegisterRequest
        const registerRequest: RegisterRequest = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formattedDate,
          gender: formData.gender,
          plan: formData.plan,
          email: formData.email.toLowerCase(),
          password: formData.password,
          current_amount: formData.currentMoney,
          monthly_income: formData.monthlyIncome ? Number(formData.monthlyIncome) : null
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
}
