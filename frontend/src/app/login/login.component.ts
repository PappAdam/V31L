import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/http/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  errorMessage: string = '';

  //Register if false
  protected login: boolean = true;

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
      if (this.login) {
        this.authService
          .login(username!, password!)
          .then(() => {
            this.router.navigate(['../']);
          })
          .catch(() => (this.errorMessage = 'TODO: Add proper error messages'));
      } else {
        this.authService
          .register(username!, password!)
          .then(() => {
            this.router.navigate(['../']);
          })
          .catch(() => (this.errorMessage = 'TODO: Add proper error messages'));
      }
    }
  }
}
