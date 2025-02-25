import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/http/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('^[a-zA-Z0-9_-]+$'),
      // Allows only letters, numbers, underscores, and dashes
    ]),
    password: new FormControl('', [
      Validators.required, // Field is required
      Validators.minLength(8), // At least 8 characters
      passwordValidator(),
      // Ensures at least one uppercase letter, one lowercase letter, and one digit
    ]),
  });

  constructor(private authService: AuthService, private router: Router) {}

  // If a token is stored in localstorage, refresh it, navigate to frontpage if the refresh was successful
  ngOnInit() {
    if (this.authService.token) {
      this.authService.refreshToken().then((token) => {
        if (token) {
          this.router.navigate(['../']);
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      return;
    }
    const { username, password } = this.loginForm.value;
    if (this.signIn) {
      this.authService.login(username!, password!).then(() => {
        this.router.navigate(['/']);
      });
    } else {
      this.authService.register(username!, password!).then(() => {
        this.router.navigate(['/']);
      });
    }
  }

  showPassord = false;
  toggleShowPassword(event: MouseEvent) {
    this.showPassord = !this.showPassord;
    event.stopPropagation();
  }

  signIn: boolean = true;
  togglePromptText(event: MouseEvent) {
    this.loginForm.reset();
    this.signIn = !this.signIn;
  }
  get promptText() {
    return this.signIn ? 'Sign In' : 'Sign Up';
  }
}
export function passwordValidator(): ValidatorFn {
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
