export interface Book {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher: string;
  numPages: number;
  price: number; // war string, nun number
  cover: string;
  abstract: string;
  userId: number;
}
