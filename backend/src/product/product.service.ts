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

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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
}
