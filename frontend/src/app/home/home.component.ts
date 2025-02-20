import { Component } from '@angular/core';
import { AuthService } from '../services/http/auth.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(protected authService: AuthService) {}
  ngOnInit() {
    console.log(this.authService.token);
  }
}
