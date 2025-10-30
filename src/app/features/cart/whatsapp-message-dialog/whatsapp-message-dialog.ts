import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-whatsapp-message-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './whatsapp-message-dialog.html',
  styleUrl: './whatsapp-message-dialog.css'
})
export class WhatsappMessageDialog {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  copied: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<WhatsappMessageDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      message: string;
      phoneNumber: string;
      encodedMessage: string;
    }
  ) {}

  copyMessage(): void {
    navigator.clipboard.writeText(this.data.message).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      // Fallback: seleccionar texto
      this.messageTextarea.nativeElement.select();
      document.execCommand('copy');
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }

  openWhatsApp(): void {
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${this.data.phoneNumber}&text=${this.data.encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
