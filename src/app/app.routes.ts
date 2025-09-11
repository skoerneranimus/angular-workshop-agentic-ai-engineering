import { Routes } from '@angular/router';
import { BookListComponent } from './books/book-list.component';

export const routes: Routes = [
  { path: '', component: BookListComponent },
  { path: 'books/:id/edit', loadComponent: () => import('./books/book-edit.component').then(m => m.BookEditComponent) },
  // Optional: Placeholder for future detail view to avoid 404
  // { path: 'books/:id', loadComponent: () => import('./books/book-detail.component').then(m => m.BookDetailComponent) },
  { path: '**', redirectTo: '' }
];
