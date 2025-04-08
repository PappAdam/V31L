import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h3 mat-dialog-title>{{ data.title }}</h3>
    <p class="content">
      {{ data.content }}
    </p>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">No</button>
      <button mat-flat-button cdkFocusInitial [mat-dialog-close]="true">
        Yes
      </button>
    </mat-dialog-actions>
  `,
  styles: `
  @use '../../../styles/mat-map' as *;
    .content {
      padding: 0 24px;
      color: $mat-sys-on-surface;
    }
  `,
})
export class ConfirmDialog {
  readonly data = inject(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialog>);
}
