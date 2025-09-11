import { Component, computed, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PageChangeEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-pagination',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div class="flex justify-between flex-1 sm:hidden">
        <!-- Mobile pagination -->
        <button
          (click)="goToPreviousPage()"
          [disabled]="currentPage() === 1"
          [class]="previousButtonClass()"
          aria-label="Go to previous page"
        >
          Previous
        </button>
        <span class="text-sm text-gray-700">
          Page {{ currentPage() }} of {{ totalPages() }}
        </span>
        <button
          (click)="goToNextPage()"
          [disabled]="currentPage() === totalPages() || totalPages() === 0"
          [class]="nextButtonClass()"
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>

      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing
            <span class="font-medium">{{ startItem() }}</span>
            to
            <span class="font-medium">{{ endItem() }}</span>
            of
            <span class="font-medium">{{ totalItems() }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <!-- Previous button -->
            <button
              (click)="goToPreviousPage()"
              [disabled]="currentPage() === 1"
              [class]="previousButtonClass()"
              aria-label="Go to previous page"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Page numbers -->
            @for (page of visiblePages(); track page) {
              @if (page === '...') {
                <span class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                  ...
                </span>
              } @else {
                <button
                  (click)="goToPage(+page)"
                  [class]="getPageButtonClass(+page)"
                  [attr.aria-label]="'Go to page ' + page"
                  [attr.aria-current]="currentPage() === +page ? 'page' : null"
                >
                  {{ page }}
                </button>
              }
            }

            <!-- Next button -->
            <button
              (click)="goToNextPage()"
              [disabled]="currentPage() === totalPages() || totalPages() === 0"
              [class]="nextButtonClass()"
              aria-label="Go to next page"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>

      <!-- Page size selector -->
      @if (showPageSizeSelector()) {
        <div class="ml-4">
          <label for="pageSize" class="sr-only">Items per page</label>
          <select
            id="pageSize"
            [(ngModel)]="selectedPageSize"
            (ngModelChange)="onPageSizeModelChange($event)"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size">{{ size }} per page</option>
            }
          </select>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class Pagination {
  // Inputs
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  totalItems = input.required<number>();
  pageSize = input.required<number>();
  showPageSizeSelector = input<boolean>(true);
  pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  // Local state for the select element
  selectedPageSize = signal<number>(10);

  // Outputs
  pageChange = output<PageChangeEvent>();

  constructor() {
    // Synchronize local state with input
    effect(() => {
      this.selectedPageSize.set(this.pageSize());
    });
  }

  // Computed properties
  startItem = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endItem = computed(() => {
    const start = this.startItem();
    const size = this.pageSize();
    const total = this.totalItems();
    return Math.min(start + size - 1, total);
  });

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current <= 4) {
        // Show pages 2-5 and ellipsis before last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
      } else if (current >= total - 3) {
        // Show ellipsis after first page and last 4 pages
        pages.push('...');
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Show ellipsis, current page with neighbors, ellipsis
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
      }

      // Always show last page if not already included
      if (pages[pages.length - 1] !== total) {
        pages.push(total);
      }
    }

    return pages;
  });

  // Methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit({ page, pageSize: this.pageSize() });
    }
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageChange.emit({ page: 1, pageSize: newPageSize });
  }

  onPageSizeModelChange(newPageSize: number): void {
    console.log('Page size model changed to:', newPageSize);
    this.pageChange.emit({ page: 1, pageSize: newPageSize });
  }

  // CSS class methods
  previousButtonClass(): string {
    const baseClass = 'relative inline-flex items-center px-2 py-2 text-sm font-medium border border-gray-300 rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
    const enabledClass = 'bg-white text-gray-500 hover:bg-gray-50';
    const disabledClass = 'bg-gray-100 text-gray-300 cursor-not-allowed';
    
    return `${baseClass} ${this.currentPage() === 1 ? disabledClass : enabledClass}`;
  }

  nextButtonClass(): string {
    const baseClass = 'relative inline-flex items-center px-2 py-2 text-sm font-medium border border-gray-300 rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
    const enabledClass = 'bg-white text-gray-500 hover:bg-gray-50';
    const disabledClass = 'bg-gray-100 text-gray-300 cursor-not-allowed';
    
    const isDisabled = this.currentPage() === this.totalPages() || this.totalPages() === 0;
    return `${baseClass} ${isDisabled ? disabledClass : enabledClass}`;
  }

  getPageButtonClass(page: number): string {
    const baseClass = 'relative inline-flex items-center px-4 py-2 text-sm font-medium border focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
    const activeClass = 'z-10 bg-blue-50 border-blue-500 text-blue-600';
    const inactiveClass = 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50';
    
    return `${baseClass} ${this.currentPage() === page ? activeClass : inactiveClass}`;
  }
}
