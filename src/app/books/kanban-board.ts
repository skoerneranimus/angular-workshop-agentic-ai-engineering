import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDropListGroup, CdkDragPreview, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookStatusService, BookStatus } from '../shared/book-status.service';
import { Router } from '@angular/router';

interface KanbanColumn {
  id: BookStatus;
  title: string;
  books: Book[];
}

@Component({
  selector: 'app-kanban-board',
  imports: [CommonModule, NgOptimizedImage, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-12 max-w-7xl">
      <h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-blue-700 border-b pb-4 border-gray-200">
        Kanban Board
      </h1>

      @if (loading()) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-pulse flex flex-col items-center">
            <div class="h-16 w-16 rounded-full border-4 border-t-blue-700 border-r-blue-700 border-b-gray-200 border-l-gray-200 animate-spin"></div>
            <p class="mt-4 text-gray-600">Loading books...</p>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" cdkDropListGroup>
          <div class="bg-gray-50 rounded-lg p-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 text-center">
              Nicht gelesen
              <span class="text-sm font-normal text-gray-600 ml-2">({{ columns()[0].books.length }})</span>
            </h2>
            
            <div 
              class="min-h-[400px] space-y-3"
              cdkDropList
              [cdkDropListData]="columns()[0].books"
              cdkDropListId="nicht-gelesen"
              (cdkDropListDropped)="onDrop($event)"
            >
              @for (book of columns()[0].books; track book.id) {
                <div 
                  class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-move"
                  cdkDrag
                  [cdkDragData]="book"
                >
                  <div class="p-4">
                    <div class="flex items-start space-x-3">
                      @if (book.cover) {
                        <img
                          [ngSrc]="book.cover"
                          width="60"
                          height="80"
                          [alt]="book.title"
                          class="w-15 h-20 object-contain bg-gray-100 rounded flex-shrink-0"
                          loading="lazy"
                        />
                      } @else {
                        <div class="w-15 h-20 bg-gray-100 flex items-center justify-center rounded flex-shrink-0">
                          <span class="text-gray-500 text-xs">No cover</span>
                        </div>
                      }
                      
                      <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {{ book.title }}
                        </h3>
                        @if (book.subtitle) {
                          <p class="text-xs text-gray-600 line-clamp-1 mb-1">{{ book.subtitle }}</p>
                        }
                        <p class="text-xs text-blue-600 font-medium">{{ book.author }}</p>
                        @if (book.isbn) {
                          <p class="text-xs text-gray-400 mt-1">ISBN: {{ book.isbn }}</p>
                        }
                      </div>
                    </div>
                    
                    <div class="mt-3 flex justify-between items-center">
                      <button
                        (click)="onEdit(book); $event.stopPropagation();"
                        class="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <span class="text-xs text-gray-400">{{ book.numPages }} pages</span>
                    </div>
                  </div>
                  
                  <!-- CDK Drag Preview -->
                  <div class="bg-white rounded-lg shadow-lg border-2 border-blue-500" *cdkDragPreview>
                    <div class="p-3">
                      <div class="flex items-start space-x-2">
                        @if (book.cover) {
                          <img
                            [src]="book.cover"
                            width="40"
                            height="60"
                            [alt]="book.title"
                            class="w-10 h-15 object-contain bg-gray-100 rounded flex-shrink-0"
                          />
                        }
                        <div class="flex-1 min-w-0">
                          <h3 class="text-sm font-medium text-gray-900 line-clamp-1">
                            {{ book.title }}
                          </h3>
                          <p class="text-xs text-blue-600">{{ book.author }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
              
              @if (columns()[0].books.length === 0) {
                <div class="flex flex-col items-center justify-center py-12 text-center">
                  <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p class="text-sm text-gray-500">No books in nicht gelesen</p>
                  <p class="text-xs text-gray-400 mt-1">Drag books here to organize them</p>
                </div>
              }
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 text-center">
              Interessant
              <span class="text-sm font-normal text-gray-600 ml-2">({{ columns()[1].books.length }})</span>
            </h2>
            
            <div 
              class="min-h-[400px] space-y-3"
              cdkDropList
              [cdkDropListData]="columns()[1].books"
              cdkDropListId="interessant"
              (cdkDropListDropped)="onDrop($event)"
            >
              @for (book of columns()[1].books; track book.id) {
                <div 
                  class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-move"
                  cdkDrag
                  [cdkDragData]="book"
                >
                  <div class="p-4">
                    <div class="flex items-start space-x-3">
                      @if (book.cover) {
                        <img
                          [ngSrc]="book.cover"
                          width="60"
                          height="80"
                          [alt]="book.title"
                          class="w-15 h-20 object-contain bg-gray-100 rounded flex-shrink-0"
                          loading="lazy"
                        />
                      } @else {
                        <div class="w-15 h-20 bg-gray-100 flex items-center justify-center rounded flex-shrink-0">
                          <span class="text-gray-500 text-xs">No cover</span>
                        </div>
                      }
                      
                      <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {{ book.title }}
                        </h3>
                        @if (book.subtitle) {
                          <p class="text-xs text-gray-600 line-clamp-1 mb-1">{{ book.subtitle }}</p>
                        }
                        <p class="text-xs text-blue-600 font-medium">{{ book.author }}</p>
                        @if (book.isbn) {
                          <p class="text-xs text-gray-400 mt-1">ISBN: {{ book.isbn }}</p>
                        }
                      </div>
                    </div>
                    
                    <div class="mt-3 flex justify-between items-center">
                      <button
                        (click)="onEdit(book); $event.stopPropagation();"
                        class="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <span class="text-xs text-gray-400">{{ book.numPages }} pages</span>
                    </div>
                  </div>
                  
                  <!-- CDK Drag Preview -->
                  <div class="bg-white rounded-lg shadow-lg border-2 border-blue-500" *cdkDragPreview>
                    <div class="p-3">
                      <div class="flex items-start space-x-2">
                        @if (book.cover) {
                          <img
                            [src]="book.cover"
                            width="40"
                            height="60"
                            [alt]="book.title"
                            class="w-10 h-15 object-contain bg-gray-100 rounded flex-shrink-0"
                          />
                        }
                        <div class="flex-1 min-w-0">
                          <h3 class="text-sm font-medium text-gray-900 line-clamp-1">
                            {{ book.title }}
                          </h3>
                          <p class="text-xs text-blue-600">{{ book.author }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
              
              @if (columns()[1].books.length === 0) {
                <div class="flex flex-col items-center justify-center py-12 text-center">
                  <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p class="text-sm text-gray-500">No books in interessant</p>
                  <p class="text-xs text-gray-400 mt-1">Drag books here to organize them</p>
                </div>
              }
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 text-center">
              Gelesen
              <span class="text-sm font-normal text-gray-600 ml-2">({{ columns()[2].books.length }})</span>
            </h2>
            
            <div 
              class="min-h-[400px] space-y-3"
              cdkDropList
              [cdkDropListData]="columns()[2].books"
              cdkDropListId="gelesen"
              (cdkDropListDropped)="onDrop($event)"
            >
              @for (book of columns()[2].books; track book.id) {
                <div 
                  class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-move"
                  cdkDrag
                  [cdkDragData]="book"
                >
                  <div class="p-4">
                    <div class="flex items-start space-x-3">
                      @if (book.cover) {
                        <img
                          [ngSrc]="book.cover"
                          width="60"
                          height="80"
                          [alt]="book.title"
                          class="w-15 h-20 object-contain bg-gray-100 rounded flex-shrink-0"
                          loading="lazy"
                        />
                      } @else {
                        <div class="w-15 h-20 bg-gray-100 flex items-center justify-center rounded flex-shrink-0">
                          <span class="text-gray-500 text-xs">No cover</span>
                        </div>
                      }
                      
                      <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {{ book.title }}
                        </h3>
                        @if (book.subtitle) {
                          <p class="text-xs text-gray-600 line-clamp-1 mb-1">{{ book.subtitle }}</p>
                        }
                        <p class="text-xs text-blue-600 font-medium">{{ book.author }}</p>
                        @if (book.isbn) {
                          <p class="text-xs text-gray-400 mt-1">ISBN: {{ book.isbn }}</p>
                        }
                      </div>
                    </div>
                    
                    <div class="mt-3 flex justify-between items-center">
                      <button
                        (click)="onEdit(book); $event.stopPropagation();"
                        class="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <span class="text-xs text-gray-400">{{ book.numPages }} pages</span>
                    </div>
                  </div>
                  
                  <!-- CDK Drag Preview -->
                  <div class="bg-white rounded-lg shadow-lg border-2 border-blue-500" *cdkDragPreview>
                    <div class="p-3">
                      <div class="flex items-start space-x-2">
                        @if (book.cover) {
                          <img
                            [src]="book.cover"
                            width="40"
                            height="60"
                            [alt]="book.title"
                            class="w-10 h-15 object-contain bg-gray-100 rounded flex-shrink-0"
                          />
                        }
                        <div class="flex-1 min-w-0">
                          <h3 class="text-sm font-medium text-gray-900 line-clamp-1">
                            {{ book.title }}
                          </h3>
                          <p class="text-xs text-blue-600">{{ book.author }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
              
              @if (columns()[2].books.length === 0) {
                <div class="flex flex-col items-center justify-center py-12 text-center">
                  <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p class="text-sm text-gray-500">No books in gelesen</p>
                  <p class="text-xs text-gray-400 mt-1">Drag books here to organize them</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .cdk-drag-placeholder {
      opacity: 0.4;
      background: #f3f4f6;
      border: 2px dashed #d1d5db;
    }
  `
})
export class KanbanBoard {
  private readonly api = inject(BookApiClient);
  private readonly bookStatusService = inject(BookStatusService);
  private readonly router = inject(Router);

  // State
  books = signal<Book[]>([]);
  loading = signal<boolean>(true);

  // Computed columns with books
  columns = computed<KanbanColumn[]>(() => {
    const allBooks = this.books();
    const bookStatuses = this.bookStatusService.getBookStatusesSignal()();

    return [
      {
        id: 'nicht-gelesen' as BookStatus,
        title: 'Nicht gelesen',
        books: allBooks.filter(book => (bookStatuses[book.id] || 'nicht-gelesen') === 'nicht-gelesen')
      },
      {
        id: 'interessant' as BookStatus,
        title: 'Interessant',
        books: allBooks.filter(book => bookStatuses[book.id] === 'interessant')
      },
      {
        id: 'gelesen' as BookStatus,
        title: 'Gelesen',
        books: allBooks.filter(book => bookStatuses[book.id] === 'gelesen')
      }
    ];
  });

  constructor() {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.loading.set(true);
    // Load all books without pagination for Kanban view
    this.api.getBooks(1000).subscribe({
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

  onDrop(event: CdkDragDrop<Book[]>): void {
    const book = event.item.data || event.previousContainer.data[event.previousIndex];
    
    // Map CDK container IDs to our BookStatus values
    const containerIdToStatus: { [key: string]: BookStatus } = {
      'nicht-gelesen': 'nicht-gelesen',
      'interessant': 'interessant', 
      'gelesen': 'gelesen',
      // Fallback for auto-generated IDs
      'cdk-drop-list-0': 'nicht-gelesen',
      'cdk-drop-list-1': 'interessant',
      'cdk-drop-list-2': 'gelesen'
    };
    
    const newStatus = containerIdToStatus[event.container.id] || 'nicht-gelesen';
    
    console.log('Drop event:', {
      book: book.title,
      from: event.previousContainer.id,
      to: event.container.id,
      mappedStatus: newStatus
    });

    if (event.previousContainer === event.container) {
      // Same column - just reorder (optional, we could skip this)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different column - only update status in localStorage
      // The UI will automatically update via the computed signal
      this.bookStatusService.setBookStatus(book.id, newStatus);
      console.log('Status updated for book:', book.id, 'to:', newStatus);
      
      // Force change detection by triggering a new computation
      this.books.set([...this.books()]);
    }
  }

  onEdit(book: Book): void {
    this.router.navigate(['/books', book.id, 'edit']);
  }
}
