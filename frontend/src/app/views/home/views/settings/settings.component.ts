import { AuthService } from '@/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { GroupOptionCardComponent } from '../../../chat/components/details/components/group-option-card/group-option-card.component';
import { MatDividerModule } from '@angular/material/divider';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog/confirm-dialog.component';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { passwordValidator } from '@/login/login.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  imports: [AsyncPipe, GroupOptionCardComponent, MatDividerModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  username$ = this.authService.user$.pipe(map((u) => u?.username));

  mfaToggleEnabled: boolean = this.authService.user?.mfaEnabled || false;

  onChangePassword() {
    this.dialog
      .open(PasswordChangeDialog)
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.snackBar.open('Password changed successfully', 'OK');
        }
      });
  }

  onToggleTwoFactor(enabled: boolean) {
    if (enabled) {
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Do you want to enable 2FA?',
            content:
              "You will be logged out, and prompted to add an authenticatior app. You won't be able to log in without it.",
          },
        })
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (!confirmed) this.mfaToggleEnabled = false;
          else this.authService.enableMfa();
        });
    } else {
      this.dialog
        .open(DisableMfaDialog)
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (!confirmed) this.mfaToggleEnabled = true;
        });
    }
  }

  onDeleteProfile() {
    const confirmDialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Are you sure you want to delete your profile?',
        content: "You won't be able to recover any of your data.",
      },
    });

    confirmDialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.authService.deleteUser();
      }
    });
  }

  onLogout() {
    const confirmDialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Are you sure you want to log out?',
      },
    });

    confirmDialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.authService.logout();
      }
    });
  }
}

@Component({
  selector: 'disable-mfa-dialog',
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
class DisableMfaDialog {
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<DisableMfaDialog>);

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
      const response = await this.authService.disableMfa(this.code.value!);

      if (!response || response.result !== 'Success') {
        this.handleError();
      } else {
        this.dialogRef.close(true);
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
  selector: 'password-change-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  template: `
    <h3 mat-dialog-title>Change Password</h3>
    <mat-dialog-content>
      <mat-form-field appearance="outline" [style.margin-top.px]="10">
        <mat-label>Old Password</mat-label>
        <input
          matInput
          [formControl]="oldPassword"
          placeholder="Enter current password"
          type="password"
        />
        @if (oldPassword.hasError('required')) {
        <mat-error> Old password is required </mat-error>
        } @if (oldPassword.hasError('incorrect')) {
        <mat-error> Incorrect password </mat-error>
        }
      </mat-form-field>
      <br />
      <mat-form-field appearance="outline" [style.margin-top.px]="10">
        <mat-label>New Password</mat-label>
        <input
          matInput
          [formControl]="newPassword"
          placeholder="Enter new password"
          type="password"
        />
        @if (newPassword.hasError('required')) {
        <mat-error> New password is required </mat-error>
        } @if (newPassword.hasError('minlength')) {
        <mat-error> Minimum 8 characters required </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="oldPassword.invalid || newPassword.invalid"
        (click)="submitChange()"
      >
        Change Password
      </button>
    </mat-dialog-actions>
  `,
})
class PasswordChangeDialog {
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<PasswordChangeDialog>);

  oldPassword = new FormControl('', [Validators.required]);
  newPassword = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
    passwordValidator(),
  ]);

  async submitChange() {
    if (this.oldPassword.invalid || this.newPassword.invalid) return;

    try {
      const response = await this.authService.changePassword(
        this.oldPassword.value!,
        this.newPassword.value!
      );

      if (!response || response.result !== 'Success') {
        this.handleError('oldPassword');
      } else {
        this.dialogRef.close(true);
      }
    } catch (error) {
      this.handleError('oldPassword');
    }
  }

  private handleError(control: 'oldPassword' | 'newPassword') {
    const targetControl = this[control];
    targetControl.setErrors({ incorrect: true });
    targetControl.markAsTouched();
  }
}
