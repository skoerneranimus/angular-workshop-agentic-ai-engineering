import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

@Component({
  selector: 'app-book-list',
  // standalone Flag laut Projekt-Guidelines weggelassen
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-12 max-w-7xl">
      <h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-blue-700 border-b pb-4 border-gray-200">Book Collection</h1>

      <div class="mb-6">
        <div class="flex items-center border-b-2 border-gray-300 py-2">
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search for books..."
            class="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
          />
          @if (searchTerm()) {
            <button (click)="clearSearch()" class="flex-shrink-0 text-gray-500 hover:text-gray-700" aria-label="Clear search">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-pulse flex flex-col items-center">
            <div class="h-16 w-16 rounded-full border-4 border-t-blue-700 border-r-blue-700 border-b-gray-200 border-l-gray-200 animate-spin"></div>
            <p class="mt-4 text-gray-600">Loading books...</p>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          @for (book of books(); track trackById) {
            <div class="relative group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
              <a [routerLink]="['/books', book.id]" class="block relative aspect-[3/4] overflow-hidden">
                @if (book.cover) {
                  <img
                    [src]="book.cover"
                    [alt]="book.title"
                    class="w-full h-full object-contain bg-gray-100"
                    loading="lazy"
                  />
                } @else {
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span class="text-gray-500 text-sm font-medium">No cover</span>
                  </div>
                }
              </a>
              <div class="p-5 flex flex-col flex-grow">
                <h2 class="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{{ book.title }}</h2>
                @if (book.subtitle) {
                  <p class="text-sm text-gray-600 mb-2 line-clamp-2">{{ book.subtitle }}</p>
                }
                <div class="text-sm text-gray-700 mt-auto">
                  <p><span class="text-blue-700">{{ book.author }}</span></p>
                  @if (book.isbn) {
                    <p class="text-xs text-gray-500 mt-2">ISBN: {{ book.isbn }}</p>
                  }
                </div>
              </div>
              <div class="absolute top-2 right-2 flex items-center">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition h-8 w-8"
                  [attr.aria-label]="'Buch bearbeiten: ' + book.title"
                  title="Bearbeiten"
                  (click)="onEdit(book); $event.stopPropagation(); $event.preventDefault();"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97l-9.193 9.193a2.1 2.1 0 0 1-.878.53l-3.247.973.973-3.247a2.1 2.1 0 0 1 .53-.878l9.193-9.193ZM19.5 6.75l-1.5-1.5M5.25 19.5h13.5" />
                  </svg>
                </button>
              </div>
            </div>
          }

          @if (books().length === 0) {
            <div class="col-span-full flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p class="text-xl font-medium text-gray-600 mb-2">
                {{ searchTerm() ? 'No books match your search' : 'No books available' }}
              </p>
              <p class="text-gray-500">
                {{ searchTerm() ? 'Try different search terms or clear the search' : 'Check back later' }}
              </p>
              @if (searchTerm()) {
                <button (click)="clearSearch()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition" aria-label="Clear search">
                  Clear Search
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class BookListComponent {
  // Konfigurierbare PageSize als Input-Signal
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
