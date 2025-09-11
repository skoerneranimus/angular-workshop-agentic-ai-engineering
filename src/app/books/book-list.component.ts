import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

@Component({
  selector: 'app-book-list',
  // standalone flag omitted according to project guidelines
  imports: [CommonModule, FormsModule, RouterModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-list.component.html'
})
export class BookListComponent {
  // Configurable PageSize as Input-Signal
  pageSize = input<number>(10);

  // State Signals
  books = signal<Book[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');

  private readonly api = inject(BookApiClient);
  private readonly router = inject(Router);

  private searchDebounceHandle: unknown;

  constructor() {
    this.loadBooks();
  }

  private loadBooks(search?: string): void {
    this.loading.set(true);
    this.api.getBooks(this.pageSize() ?? 10, search).subscribe({
      next: books => {
        this.books.set(books);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error fetching books:', err);
        this.books.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounceHandle as number | undefined);
    this.searchDebounceHandle = setTimeout(() => this.loadBooks(this.searchTerm()), 300);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.loadBooks();
  }

  onEdit(book: Book): void {
    this.router.navigate(this.toEditLink(book));
  }

  toEditLink(book: Book): string[] {
    return ['/books', book.id, 'edit'];
  }

  trackById = (index: number, book: Book) => book.id;
}
