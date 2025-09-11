import { Routes } from '@angular/router';
import { BookListComponent } from './books/book-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/books', pathMatch: 'full' },
  { path: 'books', component: BookListComponent },
  { path: 'kanban', loadComponent: () => import('./books/kanban-board').then(m => m.KanbanBoard) },
  { path: 'books/:id/edit', loadComponent: () => import('./books/book-edit.component').then(m => m.BookEditComponent) },
  // Optional: Placeholder for future detail view to avoid 404
  // { path: 'books/:id', loadComponent: () => import('./books/book-detail.component').then(m => m.BookDetailComponent) },
  { path: '**', redirectTo: '/books' }
];
