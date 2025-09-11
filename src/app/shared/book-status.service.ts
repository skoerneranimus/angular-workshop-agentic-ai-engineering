import { Injectable, signal } from '@angular/core';

export type BookStatus = 'nicht-gelesen' | 'interessant' | 'gelesen';

export interface BookStatusData {
  [bookId: string]: BookStatus;
}

@Injectable({ providedIn: 'root' })
export class BookStatusService {
  private readonly storageKey = 'book-status-data';
  private bookStatuses = signal<BookStatusData>({});

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as BookStatusData;
        this.bookStatuses.set(data);
      }
    } catch (error) {
      console.error('Error loading book statuses from localStorage:', error);
      this.bookStatuses.set({});
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.bookStatuses()));
    } catch (error) {
      console.error('Error saving book statuses to localStorage:', error);
    }
  }

  getBookStatus(bookId: string): BookStatus {
    return this.bookStatuses()[bookId] || 'nicht-gelesen';
  }

  setBookStatus(bookId: string, status: BookStatus): void {
    console.log('Setting book status:', bookId, 'to:', status);
    this.bookStatuses.update(current => {
      const updated = {
        ...current,
        [bookId]: status
      };
      console.log('Updated book statuses:', updated);
      return updated;
    });
    this.saveToStorage();
  }

  getAllBookStatuses(): BookStatusData {
    return { ...this.bookStatuses() };
  }

  getBooksByStatus(status: BookStatus): string[] {
    const statuses = this.bookStatuses();
    return Object.keys(statuses).filter(bookId => statuses[bookId] === status);
  }

  // Signal für reaktive Updates
  getBookStatusesSignal() {
    return this.bookStatuses.asReadonly();
  }
}
