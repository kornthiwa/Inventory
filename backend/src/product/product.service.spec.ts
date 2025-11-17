/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ProductService } from './product.service';
import { Product, ProductDocument } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

describe('ProductService', () => {
  let service: ProductService;
  let model: Model<ProductDocument>;

  const mockProduct = {
    _id: new Types.ObjectId(),
    code: 'PROD-000001',
    name: 'Test Product',
    description: 'Test Description',
    price: 1000,
    quantity: 10,
    sku: 'SKU-001',
    category: new Types.ObjectId(),
    active: true,
    imageUrl: 'https://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const createMockProductModel = (): Model<ProductDocument> => {
    const mockProductModel = function (data: Record<string, unknown>) {
      return {
        ...mockProduct,
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockProduct, ...data }),
      };
    } as unknown as Model<ProductDocument>;

    (mockProductModel as any).find = jest.fn();
    (mockProductModel as any).findById = jest.fn();
    (mockProductModel as any).findByIdAndUpdate = jest.fn();
    (mockProductModel as any).findByIdAndDelete = jest.fn();
    (mockProductModel as any).countDocuments = jest.fn();
    (mockProductModel as any).create = jest.fn();

    return mockProductModel;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getModelToken(Product.name),
          useValue: createMockProductModel(),
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    model = module.get<Model<ProductDocument>>(getModelToken(Product.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 1000,
      quantity: 10,
      category: new Types.ObjectId().toString(),
      active: true,
    };

    it('should create a product with auto-generated code', async () => {
      jest.spyOn(model, 'countDocuments').mockResolvedValue(0);

      const result = await service.create(createProductDto);

      expect(model.countDocuments).toHaveBeenCalled();
      expect(result.code).toBe('PROD-000001');
    });

    it('should generate code based on count', async () => {
      jest.spyOn(model, 'countDocuments').mockResolvedValue(5);

      const result = await service.create(createProductDto);

      expect(result.code).toBe('PROD-000006');
    });

    it('should throw BadRequestException when duplicate code or SKU', async () => {
      jest.spyOn(model, 'countDocuments').mockResolvedValue(0);
      const mockInstance = new (model as any)({});
      mockInstance.save = jest.fn().mockRejectedValue({ code: 11000 });
      jest
        .spyOn(model as any, 'constructor')
        .mockImplementation(() => mockInstance);

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createProductDto)).rejects.toThrow(
        'Product code or SKU already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query: QueryProductDto = { page: 1, limit: 10 };
      const mockProducts = [mockProduct];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts),
      };

      jest.spyOn(model, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by search', async () => {
      const query: QueryProductDto = { page: 1, limit: 10, search: 'test' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest.spyOn(model, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'test', $options: 'i' } },
            { code: { $regex: 'test', $options: 'i' } },
          ]),
        }),
      );
    });

    it('should filter by category', async () => {
      const categoryId = new Types.ObjectId().toString();
      const query: QueryProductDto = {
        page: 1,
        limit: 10,
        category: categoryId,
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest.spyOn(model, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: new Types.ObjectId(categoryId),
        }),
      );
    });

    it('should filter by active status', async () => {
      const query: QueryProductDto = { page: 1, limit: 10, active: true };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest.spyOn(model, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const id = mockProduct._id.toString();
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProduct),
      };

      jest.spyOn(model, 'findById').mockReturnValue(mockQuery as any);

      const result = await service.findOne(id);

      expect(result).toEqual(mockProduct);
      expect(model.findById).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException for invalid id', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne(invalidId)).rejects.toThrow(
        'Invalid product ID',
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      const id = new Types.ObjectId().toString();
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(model, 'findById').mockReturnValue(mockQuery as any);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(
        `Product with ID ${id} not found`,
      );
    });
  });

  describe('update', () => {
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 2000,
    };

    it('should update a product', async () => {
      const id = mockProduct._id.toString();
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedProduct),
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue(mockQuery as any);

      const result = await service.update(id, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        expect.objectContaining(updateProductDto),
        { new: true, runValidators: true },
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      const invalidId = 'invalid-id';

      await expect(service.update(invalidId, updateProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      const id = new Types.ObjectId().toString();
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue(mockQuery as any);

      await expect(service.update(id, updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should convert category string to ObjectId', async () => {
      const id = mockProduct._id.toString();
      const categoryId = new Types.ObjectId().toString();
      const updateDto: UpdateProductDto = {
        category: categoryId,
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProduct),
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue(mockQuery as any);

      await service.update(id, updateDto);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          category: new Types.ObjectId(categoryId),
        }),
        { new: true, runValidators: true },
      );
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const id = mockProduct._id.toString();
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);

      await service.remove(id);

      expect(model.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException for invalid id', async () => {
      const invalidId = 'invalid-id';

      await expect(service.remove(invalidId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      const id = new Types.ObjectId().toString();
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Product with ID ${id} not found`,
      );
    });
  });
});
