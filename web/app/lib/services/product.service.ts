import { api } from "../api";

export interface Product {
  _id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  quantity: number;
  sku?: string;
  active: boolean;
  category:
    | {
        _id: string;
        name: string;
      }
    | string;
}

export interface CreateProductDto {
  name: string;
  code?: string;
  description?: string;
  price: number;
  quantity: number;
  sku?: string;
  category: string;
  active?: boolean;
  imageUrl?: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: boolean;
}

export interface ProductResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProductService {
  async getAll(params?: ProductQueryParams): Promise<ProductResponse> {
    const response = await api.get("/product", { params });
    return response.data;
  }

  async getById(id: string): Promise<Product> {
    const response = await api.get(`/product/${id}`);
    return response.data;
  }

  async create(data: CreateProductDto): Promise<Product> {
    const response = await api.post("/product", data);
    return response.data;
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.patch(`/product/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/product/${id}`);
  }

  async generateMockData(count: number = 20): Promise<Product[]> {
    const response = await api.post(`/product/mock?count=${count}`);
    return response.data;
  }
}

export const productService = new ProductService();
