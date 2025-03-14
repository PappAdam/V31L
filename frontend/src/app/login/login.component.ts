import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      // Validators.minLength(8),
      // Validators.pattern('^[a-zA-Z0-9_-]+$'),
      // Allows only letters, numbers, underscores, and dashes
    ]),
    password: new FormControl('', [
      Validators.required, // Field is required
      // Validators.minLength(8), // At least 8 characters
      // passwordValidator(),
      // Ensures at least one uppercase letter, one lowercase letter, and one digit
    ]),
  });

  mfaEnabled = signal(false);
  toggleMfaEnabled() {
    this.mfaEnabled.update((value) => !value);
  }

  errorMessage: string = '';
  showPassord = false;
  signIn: boolean = true;

  constructor(private authService: AuthService, private router: Router) {}

  get promptText() {
    return this.signIn ? 'Sign In' : 'Sign Up';
  }

  async onSubmit(): Promise<void> {
    if (!this.loginForm.valid) {
      return;
    }

    // Form is valid, so both fields are present.
    const { username, password } = this.loginForm.value as {
      username: string;
      password: string;
    };

    const authRoute = this.signIn ? 'login' : 'register';
    const response = await this.authService.authorize(
      username,
      password,
      authRoute,
      this.mfaEnabled()
    );

    if (response.result == 'Success') {
      this.router.navigate(['/']);
      return;
    }

    this.errorMessage = response.message;
    console.warn('Add this error message to login form: ', this.errorMessage);
  }

  toggleShowPassword(event: MouseEvent) {
    this.showPassord = !this.showPassord;
    event.stopPropagation();
  }

  togglePromptText(event: MouseEvent) {
    this.loginForm.reset();
    this.signIn = !this.signIn;
  }
}

function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Check for lowercase
    if (!/[a-z]/.test(value)) {
      return {
        passwordStrength: 'Password must contain at least one lowercase letter',
      };
    }

    // Check for uppercase
    if (!/[A-Z]/.test(value)) {
      return {
        passwordStrength: 'Password must contain at least one uppercase letter',
      };
    }

    // Check for number
    if (!/[0-9]/.test(value)) {
      return { passwordStrength: 'Password must contain at least one number' };
    }

    // If all conditions are satisfied, return null (no error)
    return null;
  };
}
