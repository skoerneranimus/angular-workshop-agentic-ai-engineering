import { Component, ChangeDetectionStrategy, inject, signal, effect, input, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookApiClient } from './book-api-client.service';
import { Book } from './book';
import { ToastService } from '../shared/toast.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-book-edit',
  imports: [ReactiveFormsModule],
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

  // Optional: external control (e.g. Dialog). If not set, route param is used.
  readonly bookId = input<string | null>(null);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  private readonly book = signal<Book | null>(null);
  private readonly formStatusSignal = signal<string>('INVALID');

  readonly form: FormGroup<{
    title: FormControl<string>;
    subtitle: FormControl<string>;
    author: FormControl<string>;
    publisher: FormControl<string>;
    numPages: FormControl<number>;
    price: FormControl<number>;
    cover: FormControl<string>;
    abstract: FormControl<string>;
  }> = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    subtitle: [''],
    author: [''],
    publisher: [''],
    numPages: [0],
    price: [0, [Validators.min(0)]],
    cover: [''],
    abstract: ['']
  });

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('id'))),
    { initialValue: null }
  );

  readonly formValid = computed(() => {
    return this.formStatusSignal() === 'VALID';
  });
  readonly formInvalid = computed(() => {
    return this.formStatusSignal() === 'INVALID';
  });
  readonly canSave = computed(() => this.formValid() && !this.saving());

  constructor() {
    // Subscribe to form status changes
    this.form.statusChanges.subscribe(status => {
      this.formStatusSignal.set(status);
    });
    
    // Initial status
    this.formStatusSignal.set(this.form.status);

    effect(() => {
      const explicit = this.bookId();
      const fromRoute = this.routeId();
      const id = explicit || fromRoute;
      if (!id) {
        this.loading.set(false);
        this.book.set(null);
        this.form.patchValue({
          title: '', subtitle: '', author: '', publisher: '', numPages: 0, price: 0, cover: '', abstract: ''
        });
        this.form.markAsPristine();
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
        this.form.patchValue({
          title: b.title,
          subtitle: b.subtitle ?? '',
          author: b.author,
          publisher: b.publisher,
          numPages: b.numPages,
          price: b.price,
          cover: b.cover,
          abstract: b.abstract
        });
        this.form.markAsPristine();
        // Ensure form status is updated
        this.formStatusSignal.set(this.form.status);
      },
      error: err => {
        console.error('Error loading book:', err);
        this.error.set('Book could not be loaded.');
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

  onSubmit(): void { // used by external template
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
        this.toast.show('Book saved');
        this.form.markAsPristine();
        this.router.navigate(['/']);
      },
      error: err => {
        console.error('Error saving book:', err);
        this.toast.show('Save failed');
      },
      complete: () => this.saving.set(false)
    });
  }

  // Compatibility with old inline variant
  save(): void { this.onSubmit(); }
}
