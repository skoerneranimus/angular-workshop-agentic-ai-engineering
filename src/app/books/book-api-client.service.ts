import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Book, PaginatedResponse } from './book';

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

  getBooksWithPagination(page: number = 1, pageSize: number = 10, searchTerm?: string): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams()
      .set('_page', page.toString())
      .set('_limit', pageSize.toString());

    if (searchTerm) {
      params = params.set('q', searchTerm);
    }

    return this.http.get<any[]>(this.apiUrl, { 
      params, 
      observe: 'response' 
    }).pipe(
      map((response: HttpResponse<any[]>) => {
        const books = this.mapBooks(response.body || []);
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0', 10);
        const totalPages = Math.ceil(totalCount / pageSize);
        
        return {
          data: books,
          pagination: {
            currentPage: page,
            pageSize,
            totalItems: totalCount,
            totalPages
          }
        };
      })
    );
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
