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
  templateUrl: './book-item.component.html'
})
export class BookItemComponent {
  readonly book = input.required<Book>();
}
