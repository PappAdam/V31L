import { AuthService } from '@/services/auth.service';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verify',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
})
export class MfaVerifyComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected code = new FormControl('', [Validators.pattern(/^\d{0,6}$/)]);

  constructor() {
    this.code.valueChanges.subscribe((value) => this.codeValueChanges(value!));
  }

  private codeValueChanges(value: string): void {
    // Remove non-number characters
    var sanitizedValue = value.replace(/\D/g, '');

    // Limit length to 6 digits
    if (sanitizedValue.length > 6) {
      sanitizedValue = sanitizedValue.slice(0, 6);
    }

    this.code.setValue(sanitizedValue, { emitEvent: false });

    if (sanitizedValue.length === 6) {
      this.code.disable({ emitEvent: false });
      this.submitCode();
    }
  }

  protected async submitCode() {
    const response = await this.authService.authorize2FA(this.code.value!);

    switch (response.result) {
      case 'Success':
        this.router.navigate(['/']);
        return;
      case 'Error':
        this.code.enable({ emitEvent: false });
        this.code.setValue('', { emitEvent: false });
        this.code.setErrors({ incorrect: true });
    }
  }
}
