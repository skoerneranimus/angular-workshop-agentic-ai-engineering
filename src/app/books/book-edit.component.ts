import { Component, ChangeDetectionStrategy, inject, signal, effect, input, computed } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookApiClient } from './book-api-client.service';
import { Book } from './book';
import { ToastService } from '../shared/toast.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-book-edit',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block p-4 space-y-4 max-w-xl',
    '[class.loading]': 'loading()'
  },
  template: `
    <h1 class="text-xl font-semibold">@if(bookId()) { Buch bearbeiten } @else { Neues Buch }</h1>
    @if(error()) {
      <p class="text-red-600">Fehler: {{ error() }}</p>
    }
    @if(loading()) {
      <p>Lade...</p>
    }
    @if(!loading()) {
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1" for="title">Titel</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="border rounded px-2 py-1 w-full"
            [class.border-red-500]="titleInvalid()"
            (blur)="touchTitle()"
          />
          @if(titleInvalid()) {
            <small class="text-red-600">Titel erforderlich</small>
          }
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="author">Autor</label>
          <input
            id="author"
            type="text"
            formControlName="author"
            class="border rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="price">Preis</label>
          <input
            id="price"
            type="number"
            formControlName="price"
            class="border rounded px-2 py-1 w-full"
            min="0"
            step="0.01"
          />
        </div>
        @if(currentCover()) {
          <div>
            <img
              [ngSrc]="currentCover()!"
              width="160"
              height="240"
              priority
              alt="Cover"
              class="rounded shadow"
            />
          </div>
        }
        <div class="pt-2 flex gap-2">
          <button
            type="submit"
            class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-40"
            [disabled]="form.invalid || saving()"
          >
            @if(saving()) { Speichere... } @else { Speichern }
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded border"
            [disabled]="pristine() || saving()"
            (click)="resetForm()"
          >Reset</button>
        </div>
        @if(saved()) {
          <p class="text-green-600">Gespeichert.</p>
        }
      </form>
    }
  `
})
export class BookEditComponent {
  private readonly api = inject(BookApiClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // Optional: Buch-ID als Input (z.B. für Reuse in Dialogen)
  readonly bookId = input<string | null>(null);

  // State Signals
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  private readonly book = signal<Book | null>(null);

  // Reactive Form
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    author: ['', [Validators.required]],
    price: [0, [Validators.min(0)]],
    cover: ['']
  });

  // Abgeleitete Signale
  readonly pristine = computed(() => this.form.pristine);
  readonly currentCover = computed(() => this.form.controls.cover.value || null);
  readonly titleInvalid = computed(() => {
    const c = this.form.controls.title;
    return c.invalid && (c.touched || c.dirty);
  });

  constructor() {
    effect(() => {
      const id = this.bookId();
      if (!id) {
        this.book.set(null);
        this.form.reset({
          title: '',
          author: '',
          price: 0,
          cover: ''
        });
        return;
      }
      this.fetchBook(id);
    });
  }

  private fetchBook(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getBook(id).subscribe({
      next: b => {
        this.book.set(b);
        this.form.reset({
          title: b.title,
          author: b.author,
          price: b.price,
          cover: b.cover ?? ''
        });
      },
      error: err => this.error.set('Konnte Buch nicht laden'),
      complete: () => this.loading.set(false)
    });
  }

  touchTitle(): void {
    this.form.controls.title.markAsTouched();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      author: value.author,
      price: value.price,
      cover: value.cover || undefined
    };
    const id = this.bookId();
    const obs = id ? this.api.updateBook(id, payload) : this.api.createBook(payload);
    obs.subscribe({
      next: savedBook => {
        this.book.set(savedBook);
        this.saved.set(true);
        this.form.markAsPristine();
        this.toast.show('Buch gespeichert');
        this.router.navigate(['/']);
      },
      error: () => this.error.set('Speichern fehlgeschlagen'),
      complete: () => this.saving.set(false)
    });
  }

  resetForm(): void {
    const b = this.book();
    if (b) {
      this.form.reset({
        title: b.title,
        author: b.author,
        price: b.price,
        cover: b.cover ?? ''
      });
    } else {
      this.form.reset({
        title: '',
        author: '',
        price: 0,
        cover: ''
      });
    }
    this.form.markAsPristine();
    this.saved.set(false);
  }
}
