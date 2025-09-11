import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, input, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Book, PaginationInfo } from './book';
import { BookApiClient } from './book-api-client.service';
import { Pagination, PageChangeEvent } from '../shared/pagination';

@Component({
  selector: 'app-book-list',
  // standalone flag omitted according to project guidelines
  imports: [CommonModule, FormsModule, RouterModule, NgOptimizedImage, Pagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-list.component.html'
})
export class BookListComponent {
  // Configurable PageSize as Input-Signal
  pageSize = input<number>(5);

  // State Signals
  books = signal<Book[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pagination = signal<PaginationInfo>({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 0
  });

  // Computed signals
  effectivePageSize = computed(() => this.pageSize() ?? 5);

  private readonly api = inject(BookApiClient);
  private readonly router = inject(Router);

  private searchDebounceHandle: unknown;

  constructor() {
    // Initialize pagination with correct page size
    this.pagination.set({
      currentPage: 1,
      pageSize: this.effectivePageSize(),
      totalItems: 0,
      totalPages: 0
    });
    this.loadBooksWithPagination();
  }

  private loadBooksWithPagination(page: number = 1, pageSize?: number, search?: string): void {
    this.loading.set(true);
    const size = pageSize ?? this.effectivePageSize();
    
    this.api.getBooksWithPagination(page, size, search).subscribe({
      next: response => {
        this.books.set(response.data);
        this.pagination.set(response.pagination);
        this.currentPage.set(response.pagination.currentPage);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error fetching books:', err);
        this.books.set([]);
        this.pagination.set({
          currentPage: 1,
          pageSize: size,
          totalItems: 0,
          totalPages: 0
        });
        this.loading.set(false);
      }
    });
  }

  private loadBooks(search?: string): void {
    this.loadBooksWithPagination(1, this.effectivePageSize(), search);
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

  onPageChange(event: PageChangeEvent): void {
    this.loadBooksWithPagination(event.page, event.pageSize, this.searchTerm() || undefined);
  }

  onEdit(book: Book): void {
    this.router.navigate(this.toEditLink(book));
  }

  toEditLink(book: Book): string[] {
    return ['/books', book.id, 'edit'];
  }

  trackById = (index: number, book: Book) => book.id;
}
