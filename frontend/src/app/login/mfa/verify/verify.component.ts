import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-verify',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
})
export class MfaVerifyComponent {
  code = new FormControl('', [Validators.pattern(/^\d{0,6}$/)]);

  constructor() {
    this.code.valueChanges.subscribe((value) => this.codeValueChanges(value!));
  }

  private codeValueChanges(value: string): void {
    // Remove any non-numeric characters
    const sanitizedValue = value.replace(/\D/g, '');

    // Limit to 6 digits
    if (sanitizedValue.length > 6) {
      this.code.setValue(sanitizedValue.slice(0, 6), { emitEvent: false });
      return;
    }
    this.code.setValue(sanitizedValue, { emitEvent: false });

    // Automatically submit when 6 digits are entered
    if (sanitizedValue.length === 6) {
      this.code.disable();
      this.submitCode();
    }
  }

  submitCode() {
    console.log('Code entered:', this.code.value);
    // Call API or process 6-digit code here
  }
}
