/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Types } from 'mongoose';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = {
    _id: new Types.ObjectId(),
    code: 'PROD-000001',
    name: 'Test Product',
    description: 'Test Description',
    price: 1000,
    quantity: 10,
    category: new Types.ObjectId(),
    active: true,
  };

  const mockProductService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 1000,
        quantity: 10,
        category: new Types.ObjectId().toString(),
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockProduct as any);

      const result = await controller.create(createProductDto);

      expect(service.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query: QueryProductDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [mockProduct],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult as any);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const id = mockProduct._id.toString();

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProduct as any);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const id = mockProduct._id.toString();
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 2000,
      };
      const updatedProduct = { ...mockProduct, ...updateProductDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedProduct as any);

      const result = await controller.update(id, updateProductDto);

      expect(service.update).toHaveBeenCalledWith(id, updateProductDto);
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const id = mockProduct._id.toString();

      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
