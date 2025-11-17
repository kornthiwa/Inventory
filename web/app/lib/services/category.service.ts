import { api } from "../api";

export interface Category {
  _id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  active?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface CategoryResponse {
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class CategoryService {
  async getAll(params?: CategoryQueryParams): Promise<CategoryResponse> {
    const response = await api.get("/category", { params });
    return response.data;
  }

  async getById(id: string): Promise<Category> {
    const response = await api.get(`/category/${id}`);
    return response.data;
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post("/category", data);
    return response.data;
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await api.patch(`/category/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/category/${id}`);
  }
}

export const categoryService = new CategoryService();
