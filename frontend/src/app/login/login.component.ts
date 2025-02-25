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
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(private authService: AuthService, private router: Router) {}

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
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username!, password!).then(() => {
        this.router.navigate(['/']);
      });
      // .catch(() => (this.errorMessage = 'Invalid username or password'));
    }
  }

  showPassord = false;
  toggleShowPassword(event: MouseEvent) {
    this.showPassord = !this.showPassord;
    event.stopPropagation();
  }

  signIn: boolean = true;
  togglePromptText() {
    this.signIn = !this.signIn;
  }
  get promptText() {
    return this.signIn ? 'Sign In' : 'Sign Up';
  }
}
