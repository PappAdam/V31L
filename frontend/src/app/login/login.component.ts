import { Component, Inject, inject, signal } from '@angular/core';
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
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { QRcodeComponent } from '../qrcode/qrcode.component';
import { PlatformService } from '@/services/platform.service';
import { DeviceInfo } from '@capacitor/device';
import { EncryptionService } from '@/services/encryption.service';

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
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);

  private router = inject(Router);
  private dialog = inject(MatDialog);
  platform: DeviceInfo | null = null;
  platformService: PlatformService = inject(PlatformService);

  protected loginForm = new FormGroup({
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

  // Values used to control the form
  protected mfaEnabled = false;
  protected showPassord = false;
  protected signIn = true;

  get promptText() {
    return this.signIn ? 'Sign In' : 'Sign Up';
  }

  constructor() {
    const setupCode =
      this.router.getCurrentNavigation()?.extras.state?.['setupCode'];

    if (setupCode) {
      this.openSetupDialog(setupCode);
    }

    this.platform = this.platformService.info;
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
      this.mfaEnabled ? '' : null
    );

    switch (response.result) {
      case 'Success':
        await this.encryptionService.storeMasterPassword(response.mfaSuccess);
        this.router.navigate(['/app']);
        return;

      case 'Next':
        switch (response.to) {
          case 'Setup':
            this.openSetupDialog(response.setupCode, username, password);
            return;
          case 'Verify':
            this.openVerifyDialog(username, password);
            return;
        }
      case 'Error':
        console.warn(
          'Add this error message to login form: ',
          response.message
        );
        break;
    }
  }

  private openVerifyDialog(username: string, password: string): void {
    this.dialog
      .open(VerifyDialog, {
        data: {
          title: 'Two-Factor Authentication',
          content: 'Please enter the code from your authenticator app',
          username,
          password,
        },
      })
      .afterClosed()
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['/']);
        }
      });
  }

  private openSetupDialog(
    setupCode: string,
    username?: string,
    password?: string
  ): void {
    this.dialog
      .open(SetupDialog, {
        data: { setupCode },
      })
      .afterClosed()
      .subscribe((success) => {
        if (success && username && password) {
          this.openVerifyDialog(username, password);
        } else if (!username || !password) {
          this.router.navigate(['/']);
        }
      });
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

@Component({
  selector: 'verify-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  template: `
    <h3 mat-dialog-title>Verify 2FA Code</h3>
    <mat-dialog-content>
      <mat-form-field appearance="outline" [style.margin-top.px]="10">
        <mat-label>Verification Code</mat-label>
        <input
          matInput
          [formControl]="code"
          placeholder="6-digit code"
          maxlength="6"
          type="tel"
          inputmode="numeric"
        />
        @if (code.hasError('pattern')) {
        <mat-error> Must be 6 digits </mat-error>
        } @if (code.hasError('incorrect')) {
        <mat-error> Invalid verification code </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="code.invalid"
        (click)="submitCode()"
      >
        Verify
      </button>
    </mat-dialog-actions>
  `,
})
class VerifyDialog {
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<VerifyDialog>);
  private data = inject(MAT_DIALOG_DATA);

  code = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  constructor() {
    this.code.valueChanges.subscribe((value) =>
      this.sanitizeInput(value || '')
    );
  }

  private sanitizeInput(value: string): void {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    if (sanitized !== value) {
      this.code.setValue(sanitized, { emitEvent: false });
    }

    if (sanitized.length === 6) {
      this.submitCode();
    }
  }

  async submitCode() {
    if (this.code.invalid) return;

    try {
      const response = await this.authService.authorize2FA(
        this.data.username,
        this.data.password,
        this.code.value!
      );

      if (response.result === 'Success') {
        this.dialogRef.close(true);
      } else {
        this.handleError();
      }
    } catch (error) {
      this.handleError();
    }
  }

  private handleError() {
    this.code.reset('');
    this.code.setErrors({ incorrect: true });
    this.code.markAsTouched();
  }
}

@Component({
  selector: 'setup-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, QRcodeComponent],
  template: `
    <h3 mat-dialog-title>Setup 2FA</h3>
    <mat-dialog-content>
      <p class="instructions">Scan the QR code with your authenticator app:</p>
      <app-qrcode [from]="setupCode" />
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-flat-button color="primary" (click)="onNextClick()">
        I have scanned the QR code
      </button>
    </mat-dialog-actions>
  `,
})
class SetupDialog {
  setupCode: string;
  private data = inject(MAT_DIALOG_DATA);

  constructor(private dialogRef: MatDialogRef<SetupDialog>) {
    if (!this.data?.setupCode) {
      throw new Error('No setup code provided!');
    }

    this.setupCode = this.data.setupCode;
  }

  onNextClick() {
    this.dialogRef.close(true);
  }
}

@Component({
  selector: 'master-key-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  template: `
    <h3 mat-dialog-title>Enter your Master key</h3>
    <mat-dialog-content>
      <mat-form-field appearance="outline" [style.margin-top.px]="10">
        <mat-label>Master key</mat-label>
        <input
          matInput
          [formControl]="code"
          placeholder="6-digit key"
          maxlength="6"
          type="tel"
          inputmode="numeric"
        />
        @if (code.hasError('pattern')) {
        <mat-error> Must be 6 digits </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="code.invalid"
        (click)="submitCode()"
      >
        Verify
      </button>
    </mat-dialog-actions>
  `,
})
class MasterKeyDialog {
  private encryptionService = inject(EncryptionService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<MasterKeyDialog>);

  code = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  constructor() {
    this.code.valueChanges.subscribe((value) =>
      this.sanitizeInput(value || '')
    );
  }

  private sanitizeInput(value: string): void {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    if (sanitized !== value) {
      this.code.setValue(sanitized, { emitEvent: false });
    }

    if (sanitized.length === 6) {
      this.submitCode();
    }
  }

  async submitCode() {
    if (this.code.invalid) return;
    await this.encryptionService.storeMasterPassword(this.code.value!);

    // const keysStr = localStorage.getItem('keys');
    // if (keysStr) {
    //   const keys: { id: string; encKey: string }[] = JSON.parse(keysStr);
    //   const encKey = keys.find((k) => k.id == this.authService.user!.id)?.encKey;

    //   if (encKey) {
    //     this.encryptionService._privateKey$.next(
    //       await this.encryptionService.unwrapKey(
    //         stringToCharCodeArray(encKey, Uint8Array),
    //         this.authService.masterWrapKey!,
    //         'AES-KW'
    //       )
    //     );
    //   }
    // }
    this.dialogRef.close(true);
  }
}
