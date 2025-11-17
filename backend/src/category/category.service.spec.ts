/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { CategoryService } from './category.service';
import { Category, CategoryDocument } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

describe('CategoryService', () => {
  let service: CategoryService;
  let model: Model<CategoryDocument>;

  const mockCategory = {
    _id: new Types.ObjectId(),
    code: 'CAT-000001',
    name: 'Test Category',
    description: 'Test Description',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const createMockCategoryModel = (): Model<CategoryDocument> => {
    const mockCategoryModel = function (data: Record<string, unknown>) {
      return {
        ...mockCategory,
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockCategory, ...data }),
      };
    } as unknown as Model<CategoryDocument>;

    (mockCategoryModel as any).find = jest.fn();
    (mockCategoryModel as any).findById = jest.fn();
    (mockCategoryModel as any).findByIdAndUpdate = jest.fn();
    (mockCategoryModel as any).findByIdAndDelete = jest.fn();
    (mockCategoryModel as any).countDocuments = jest.fn();
    (mockCategoryModel as any).create = jest.fn();

    return mockCategoryModel;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: createMockCategoryModel(),
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    model = module.get<Model<CategoryDocument>>(getModelToken(Category.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
      isActive: true,
    };

    it('should create a category with auto-generated code', async () => {
      jest.spyOn(model, 'countDocuments').mockResolvedValue(0);

      const result = await service.create(createCategoryDto);

      expect(model.countDocuments).toHaveBeenCalled();
      expect(result.code).toBe('CAT-000001');
    });

    it('should generate code based on count', async () => {
      jest.spyOn(model, 'countDocuments').mockResolvedValue(5);

      const result = await service.create(createCategoryDto);

      expect(result.code).toBe('CAT-000006');
    });

    it('should throw BadRequestException when duplicate name or code', async () => {
      jest.spyOn(model, 'countDocuments').mockResolvedValue(0);
      const mockInstance = new (model as any)({});
      mockInstance.save = jest.fn().mockRejectedValue({ code: 11000 });
      jest
        .spyOn(model as any, 'constructor')
        .mockImplementation(() => mockInstance);

      await expect(service.create(createCategoryDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createCategoryDto)).rejects.toThrow(
        'Category name or code already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const query: QueryCategoryDto = { page: 1, limit: 10 };
      const mockCategories = [mockCategory];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategories),
      };

      jest.spyOn(model, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockCategories);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by search', async () => {
      const query: QueryCategoryDto = { page: 1, limit: 10, search: 'test' };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockCategory]),
      };

      jest.spyOn(model, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'test', $options: 'i' } },
            { code: { $regex: 'test', $options: 'i' } },
            { description: { $regex: 'test', $options: 'i' } },
          ]),
        }),
      );
    });

    it('should filter by active status', async () => {
      const query: QueryCategoryDto = { page: 1, limit: 10, isActive: true };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockCategory]),
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
    it('should return a category by id', async () => {
      const id = mockCategory._id.toString();
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      const result = await service.findOne(id);

      expect(result).toEqual(mockCategory);
      expect(model.findById).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException for invalid id', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne(invalidId)).rejects.toThrow(
        'Invalid category ID',
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = new Types.ObjectId().toString();
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(
        `Category with ID ${id} not found`,
      );
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateCategoryDto = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('should update a category', async () => {
      const id = mockCategory._id.toString();
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedCategory),
      } as any);

      const result = await service.update(id, updateCategoryDto);

      expect(result).toEqual(updatedCategory);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateCategoryDto,
        { new: true, runValidators: true },
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      const invalidId = 'invalid-id';

      await expect(
        service.update(invalidId, updateCategoryDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = new Types.ObjectId().toString();
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.update(id, updateCategoryDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const id = mockCategory._id.toString();
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
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

    it('should throw NotFoundException when category not found', async () => {
      const id = new Types.ObjectId().toString();
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Category with ID ${id} not found`,
      );
    });
  });
});
