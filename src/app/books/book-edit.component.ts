import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookApiClient } from './book-api-client.service';
import { Book } from './book';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, tap, catchError, of } from 'rxjs';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-book-edit',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-edit.component.html'
})
export class BookEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BookApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  book = signal<Book | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    subtitle: [''],
    author: [''],
    publisher: [''],
    numPages: [0],
    price: [''],
    cover: [''],
    abstract: ['']
  });

  // Param Id as signal
  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('id'))),
    { initialValue: null }
  );

  constructor() {
    effect(() => {
      const id = this.routeId();
      if (id) {
        this.fetch(id);
      }
    });
  }

  private fetch(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.api.getBook(id).pipe(
      tap(book => {
        this.book.set(book);
        this.form.patchValue({
          title: book.title,
          subtitle: book.subtitle ?? '',
          author: book.author,
            publisher: book.publisher,
          numPages: book.numPages,
          price: book.price,
          cover: book.cover,
          abstract: book.abstract
        });
      }),
      catchError(err => {
        console.error(err);
        this.error.set('Buch konnte nicht geladen werden.');
        return of(null);
      })
    ).subscribe(() => this.loading.set(false));
  }

  reload() {
    const id = this.routeId();
    if (id) this.fetch(id);
  }

  onCancel() {
    // Zurück zur Liste oder Detail (Detail existiert noch nicht)
    this.router.navigate(['/']);
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    const id = this.book()?.id;
    if (!id) return;
    this.saving.set(true);
    this.api.updateBook(id, this.form.getRawValue()).pipe(
      tap(updated => {
        this.toast.show('Buch gespeichert');
        this.book.set(updated);
        this.router.navigate(['/']);
      }),
      catchError(err => {
        console.error(err);
        this.toast.show('Speichern fehlgeschlagen');
        return of(null);
      })
    ).subscribe(() => this.saving.set(false));
  }
}
