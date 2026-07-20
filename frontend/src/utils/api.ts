import { Category, Product, Sale } from '../types';

const getApiBaseUrl = () => {
  // If in development mode (running via Vite dev server), direct requests to backend spark port (8080)
  if (window.location.port === '3000' || window.location.port === '3001' || window.location.port === '5173') {
    return 'http://localhost:8080/api';
  }
  // Otherwise, use relative path relative to current URL pathname (so it works on XAMPP/Apache)
  let path = window.location.pathname;
  if (path.endsWith('.html') || path.endsWith('.php')) {
    path = path.substring(0, path.lastIndexOf('/'));
  }
  path = path.replace(/\/+$/, ''); // strip trailing slash
  return `${window.location.origin}${path}/api`;
};

const API_BASE_URL = getApiBaseUrl();

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // not JSON
    }
    throw new Error(errorJson?.message || errorJson?.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

// Categories API
export const apiGetCategories = () => apiFetch<Category[]>('/categories');
export const apiCreateCategory = (cat: Omit<Category, 'id'> & { id: string }) => 
  apiFetch<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(cat),
  });
export const apiUpdateCategory = (cat: Category) => 
  apiFetch<Category>(`/categories/${cat.id}`, {
    method: 'PUT',
    body: JSON.stringify(cat),
  });
export const apiDeleteCategory = (id: string) => 
  apiFetch<{ id: string }>(`/categories/${id}`, {
    method: 'DELETE',
  });

// Products API
export const apiGetProducts = () => apiFetch<Product[]>('/products');
export const apiCreateProduct = (prod: Omit<Product, 'id'> & { id: string }) => 
  apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(prod),
  });
export const apiUpdateProduct = (prod: Product) => 
  apiFetch<Product>(`/products/${prod.id}`, {
    method: 'PUT',
    body: JSON.stringify(prod),
  });
export const apiDeleteProduct = (id: string) => 
  apiFetch<{ id: string }>(`/products/${id}`, {
    method: 'DELETE',
  });

// Sales API
export const apiGetSales = () => apiFetch<Sale[]>('/sales');
export const apiCreateSale = (sale: Sale) => 
  apiFetch<Sale>('/sales', {
    method: 'POST',
    body: JSON.stringify(sale),
  });
export const apiDeleteSale = (id: string) => 
  apiFetch<{ id: string }>(`/sales/${id}`, {
    method: 'DELETE',
  });

// Settings API
export interface ShopSettings {
  shopName: string;
  shopAddress: string;
}
export const apiGetSettings = () => apiFetch<ShopSettings>('/settings');
export const apiSaveSettings = (settings: Partial<ShopSettings>) => 
  apiFetch<{ status: string; message: string }>('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
