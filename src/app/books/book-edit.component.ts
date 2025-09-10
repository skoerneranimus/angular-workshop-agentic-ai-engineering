import { Component, ChangeDetectionStrategy, inject, signal, effect, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookApiClient } from './book-api-client.service';
import { Book } from './book';
import { ToastService } from '../shared/toast.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-book-edit',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  },
  templateUrl: './book-edit.component.html'
})
export class BookEditComponent {
  private readonly api = inject(BookApiClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  // Optional: externe Steuerung (z.B. Dialog). Wenn nicht gesetzt, wird Route Param verwendet.
  readonly bookId = input<string | null>(null);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  private readonly book = signal<Book | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    subtitle: [''],
    author: [''],
    publisher: [''],
    numPages: [0],
    price: [0, [Validators.min(0)]], // jetzt als number im Modell
    cover: [''],
    abstract: ['']
  });

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('id'))),
    { initialValue: null }
  );

  readonly formInvalid = computed(() => this.form.invalid);

  constructor() {
    effect(() => {
      const explicit = this.bookId();
      const fromRoute = this.routeId();
      const id = explicit || fromRoute;
      if (!id) {
        this.loading.set(false);
        this.book.set(null);
        this.form.reset({
          title: '', subtitle: '', author: '', publisher: '', numPages: 0, price: 0, cover: '', abstract: ''
        });
        return;
      }
      this.fetch(id);
    });
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getBook(id).subscribe({
      next: b => {
        this.book.set(b);
        this.form.reset({
          title: b.title,
          subtitle: b.subtitle ?? '',
          author: b.author,
          publisher: b.publisher,
          numPages: b.numPages,
          price: b.price,
          cover: b.cover,
          abstract: b.abstract
        });
      },
      error: err => {
        console.error(err);
        this.error.set('Buch konnte nicht geladen werden.');
      },
      complete: () => this.loading.set(false)
    });
  }

  reload(): void {
    const id = this.book()?.id || this.bookId() || this.routeId();
    if (id) this.fetch(id);
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  onSubmit(): void { // genutzt vom externen Template
    if (this.form.invalid || this.saving()) return;
    const id = this.book()?.id || this.bookId() || this.routeId();
    if (!id) return;
    this.saving.set(true);
    const changes: Partial<Book> = {
      ...this.form.getRawValue(),
      price: this.form.controls.price.value
    };
    this.api.updateBook(id, changes).subscribe({
      next: updated => {
        this.book.set(updated);
        this.toast.show('Buch gespeichert');
        this.form.markAsPristine();
        this.router.navigate(['/']);
      },
      error: err => {
        console.error(err);
        this.toast.show('Speichern fehlgeschlagen');
      },
      complete: () => this.saving.set(false)
    });
  }

  // Kompatibilität zur alten Inline-Variante
  save(): void { this.onSubmit(); }
}
