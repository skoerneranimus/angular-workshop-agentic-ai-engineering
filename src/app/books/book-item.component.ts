import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Book } from './book';

@Component({
  selector: 'app-book-item',
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full'
  },
  template: `
    <div class="relative aspect-[3/4] overflow-hidden">
      @if(book()?.cover) {
        <img
          [ngSrc]="book()!.cover"
          [alt]="book()!.title"
          width="160"
            height="240"
          class="w-full h-full object-contain bg-gray-100"
          priority
        />
      } @else {
        <div class="w-full h-full bg-gray-100 flex items-center justify-center">
          <span class="text-gray-500 text-sm font-medium">No cover available</span>
        </div>
      }
    </div>
    <div class="p-5 flex flex-col flex-grow">
      <h2 class="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{{ book()?.title ?? 'Unknown Title' }}</h2>
      @if(book()?.subtitle) {
        <p class="text-sm text-gray-600 mb-2 line-clamp-2">{{ book()!.subtitle }}</p>
      }
      <div class="text-sm text-gray-700 mt-auto">
        <p>
          <span class="text-blue-700">{{ book()?.author ?? 'Unknown Author' }}</span>
        </p>
        @if(book()?.isbn) {
          <p class="text-xs text-gray-500 mt-2">ISBN: {{ book()!.isbn }}</p>
        }
      </div>
    </div>
  `
})
export class BookItemComponent {
  readonly book = input.required<Book>();
}
