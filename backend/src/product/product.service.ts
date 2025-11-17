import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product, ProductDocument } from './entities/product.entity';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const count = await this.productModel.countDocuments();
      const productCode = `PROD-${String(count + 1).padStart(6, '0')}`;

      const createdProduct = new this.productModel({
        ...createProductDto,
        code: productCode,
        category: new Types.ObjectId(createProductDto.category),
      });
      return await createdProduct.save();
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new BadRequestException('Product code or SKU already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryProductDto) {
    const { page = 1, limit = 10, search, category, active } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = new Types.ObjectId(category);
    }

    // Active filter
    if (active !== undefined) {
      filter.active = active;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category', 'name description')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const updateData: Record<string, unknown> = { ...updateProductDto };
    if (updateProductDto.category) {
      updateData.category = new Types.ObjectId(updateProductDto.category);
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('category', 'name description')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const result = await this.productModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async generateMockData(
    count: number = 20,
    categoryIds?: string[],
  ): Promise<Product[]> {
    const mockProducts = [
      { name: 'โน้ตบุ๊ก', price: 25000, quantity: 15, sku: 'NB-001' },
      { name: 'เมาส์ไร้สาย', price: 890, quantity: 50, sku: 'MS-001' },
      { name: 'คีย์บอร์ด', price: 1200, quantity: 30, sku: 'KB-001' },
      { name: 'หูฟัง', price: 1500, quantity: 25, sku: 'HP-001' },
      { name: 'เสื้อยืด', price: 299, quantity: 100, sku: 'TS-001' },
      { name: 'กางเกงยีนส์', price: 1299, quantity: 40, sku: 'JE-001' },
      { name: 'รองเท้าผ้าใบ', price: 1890, quantity: 35, sku: 'SH-001' },
      { name: 'น้ำดื่ม', price: 15, quantity: 500, sku: 'WD-001' },
      { name: 'ขนมกรุบกรอบ', price: 25, quantity: 200, sku: 'SN-001' },
      { name: 'พัดลม', price: 1290, quantity: 20, sku: 'FN-001' },
      { name: 'ทีวี', price: 15000, quantity: 10, sku: 'TV-001' },
      { name: 'ตู้เย็น', price: 25000, quantity: 8, sku: 'RF-001' },
      { name: 'ลูกฟุตบอล', price: 450, quantity: 30, sku: 'FB-001' },
      { name: 'จักรยาน', price: 3500, quantity: 12, sku: 'BK-001' },
      { name: 'หนังสือ', price: 350, quantity: 50, sku: 'BK-002' },
      { name: 'ปากกา', price: 25, quantity: 200, sku: 'PN-001' },
      { name: 'ครีมบำรุง', price: 890, quantity: 40, sku: 'CM-001' },
      { name: 'ของเล่น', price: 199, quantity: 60, sku: 'TY-001' },
      { name: 'เก้าอี้', price: 2500, quantity: 15, sku: 'CH-001' },
      { name: 'โต๊ะ', price: 3500, quantity: 10, sku: 'TB-001' },
    ];

    // Get available categories if not provided
    let availableCategoryIds = categoryIds;
    if (!availableCategoryIds || availableCategoryIds.length === 0) {
      const categories = await this.categoryModel.find().limit(20).exec();
      availableCategoryIds = categories.map((cat) => {
        const id = cat._id as Types.ObjectId;
        return id.toString();
      });
    }

    if (availableCategoryIds.length === 0) {
      throw new BadRequestException(
        'No categories available. Please create categories first.',
      );
    }

    // Get existing codes to avoid duplicates
    const existingProducts = await this.productModel
      .find({}, { code: 1 })
      .exec();
    const existingCodes = new Set(existingProducts.map((prod) => prod.code));

    // Find the highest number in existing codes
    let maxNumber = 0;
    existingCodes.forEach((code) => {
      const match = code.match(/^PROD-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    // Generate unique codes
    const productsToCreate: Array<{
      name: string;
      price: number;
      quantity: number;
      sku?: string;
      code: string;
      category: Types.ObjectId;
      active: boolean;
      description: string;
    }> = [];
    let currentNumber = maxNumber + 1;

    for (let i = 0; i < count && i < mockProducts.length; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = `PROD-${String(currentNumber).padStart(6, '0')}`;
        currentNumber++;
        attempts++;
        if (attempts > 1000) {
          // Fallback to timestamp if too many attempts
          code = `PROD-${Date.now()}-${i}`;
          break;
        }
      } while (existingCodes.has(code));

      existingCodes.add(code);
      const randomCategoryId =
        availableCategoryIds[
          Math.floor(Math.random() * availableCategoryIds.length)
        ];
      productsToCreate.push({
        ...mockProducts[i],
        code,
        category: new Types.ObjectId(randomCategoryId),
        active: true,
        description: `คำอธิบายสำหรับ${mockProducts[i].name}`,
      });
    }

    const createdProducts =
      await this.productModel.insertMany(productsToCreate);
    return createdProducts;
  }
}
