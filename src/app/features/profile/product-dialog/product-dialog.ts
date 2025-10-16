import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../../shared/models/product.model';
import { ProductRequest } from '../../../shared/models/product-request.model';
import { ProductService } from '../../../core/services/product.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { CryptoService } from '../../../core/services/crypto.service';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './product-dialog.html',
  styleUrl: './product-dialog.css'
})
export class ProductDialog implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  productForm: FormGroup;
  isEditMode: boolean = false;
  imagePreview: string | null = null;
  uploadingImage: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Product | null,
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private cryptoService: CryptoService,
    private toast: NgToastService
  ) {
    this.isEditMode = !!data;

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      short_description: ['', [Validators.required, Validators.maxLength(300)]],
      long_description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      discount_percentage: [0, [Validators.min(0), Validators.max(100)]],
      image_url: ['', Validators.required],
      youtube_links: this.fb.array([]),
      is_active: [true]
    });
  }

  ngOnInit() {
    if (this.isEditMode && this.data) {
      this.loadProductData(this.data);
    }

    // Listener para calcular precio final
    this.productForm.get('price')?.valueChanges.subscribe(() => this.calculateFinalPrice());
    this.productForm.get('discount_percentage')?.valueChanges.subscribe(() => this.calculateFinalPrice());
  }

  get youtubeLinks(): FormArray {
    return this.productForm.get('youtube_links') as FormArray;
  }

  get finalPrice(): number | null {
    const price = this.productForm.get('price')?.value;
    const discount = this.productForm.get('discount_percentage')?.value;

    if (price && discount >= 0) {
      return price - (price * discount / 100);
    }
    return price;
  }

  get discountAmount(): number {
    const price = this.productForm.get('price')?.value || 0;
    const discount = this.productForm.get('discount_percentage')?.value || 0;
    return price * discount / 100;
  }

  calculateFinalPrice() {
    // Trigger change detection
    this.productForm.updateValueAndValidity({ emitEvent: false });
  }

  get shortDescriptionLength(): number {
    const value = this.productForm.get('short_description')?.value;
    return value ? value.length : 0;
  }

  loadProductData(product: Product) {
    this.productForm.patchValue({
      name: product.name,
      short_description: product.short_description,
      long_description: product.long_description,
      price: product.price,
      discount_percentage: product.discount_percentage,
      image_url: product.image_url,
      is_active: product.is_active
    });

    this.imagePreview = product.image_url;

    // Cargar videos de YouTube
    if (product.youtube_links && product.youtube_links.length > 0) {
      product.youtube_links.forEach(link => {
        this.youtubeLinks.push(this.fb.control(link));
      });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadingImage = true;

      // Preview local
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      this.cloudinaryService.uploadImage(file).subscribe({
        next: (url) => {
          this.productForm.patchValue({ image_url: url });
          this.uploadingImage = false;
          this.toast.success('Imagen subida exitosamente', 'Éxito', 2000);
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.uploadingImage = false;
          this.imagePreview = null;
          this.toast.danger('Error al subir la imagen', 'Error', 3000);
        }
      });
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.productForm.patchValue({ image_url: '' });
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  addVideoInput() {
    this.youtubeLinks.push(this.fb.control(''));
  }

  removeVideo(index: number) {
    this.youtubeLinks.removeAt(index);
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const userId = this.cryptoService.getCurrentUserId();
    if (!userId) {
      this.toast.danger('No se pudo identificar al usuario', 'Error', 3000);
      return;
    }

    const formValue = this.productForm.value;

    // 🔹 Si el descuento está vacío, asumir 0
    if (formValue.discount_percentage === null || formValue.discount_percentage === '' || isNaN(formValue.discount_percentage)) {
      formValue.discount_percentage = 0;
    }

    // Filtrar videos vacíos
    const validVideos = formValue.youtube_links.filter((link: string) => link.trim() !== '');

    const productRequest: ProductRequest = {
      name: formValue.name,
      short_description: formValue.short_description,
      long_description: formValue.long_description,
      price: parseFloat(formValue.price),
      discount_percentage: parseFloat(formValue.discount_percentage),
      image_url: formValue.image_url,
      youtube_links: validVideos,
      is_active: formValue.is_active
    };

    if (this.isEditMode && this.data?.id) {
      // Update
      this.productService.updateProduct(this.data.id, productRequest as any).subscribe({
        next: (result) => {
          if (result) {
            this.toast.success('Producto actualizado exitosamente', 'Éxito', 3000);
            this.dialogRef.close(true);
          }
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.toast.danger('Error al actualizar el producto', 'Error', 3000);
        }
      });
    } else {
      // Create
      this.productService.createProduct(productRequest as any).subscribe({
        next: (result) => {
          if (result) {
            this.toast.success('Producto creado exitosamente', 'Éxito', 3000);
            this.dialogRef.close(true);
          }
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.toast.danger('Error al crear el producto', 'Error', 3000);
        }
      });
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
