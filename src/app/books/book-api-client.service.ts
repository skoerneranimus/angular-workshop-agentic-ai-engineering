import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Book } from './book';

@Injectable({ providedIn: 'root' })
export class BookApiClient {
  private readonly apiUrl = 'http://localhost:4730/books';

  constructor(private http: HttpClient) {}

  private mapBook = (raw: any): Book => ({
    ...raw,
    price: parseFloat(raw.price as string) || 0
  });

  private mapBooks = (raw: any[]): Book[] => raw.map(this.mapBook);

  getBooks(pageSize: number = 10, searchTerm?: string): Observable<Book[]> {
    let params = new HttpParams().set('_limit', pageSize.toString());

    if (searchTerm) {
      params = params.set('q', searchTerm);
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(map(this.mapBooks));
  }

  getBook(id: string): Observable<Book> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(this.mapBook));
  }

  updateBook(id: string, changes: Partial<Book>): Observable<Book> {
    const body: any = { ...changes };
    if (body.price != null) {
      body.price = body.price.toString();
    }
    return this.http.patch<any>(`${this.apiUrl}/${id}`, body).pipe(map(this.mapBook));
  }
}
