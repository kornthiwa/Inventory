import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Category, CategoryDocument } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const count = await this.categoryModel.countDocuments();
      const categoryCode = `CAT-${String(count + 1).padStart(6, '0')}`;

      const createdCategory = new this.categoryModel({
        ...createCategoryDto,
        code: categoryCode,
      });
      return await createdCategory.save();
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new BadRequestException('Category code already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryCategoryDto) {
    const { page = 1, limit = 10, search, active } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Active filter
    if (active !== undefined) {
      filter.active = active;
    }

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const result = await this.categoryModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async generateMockData(count: number = 20): Promise<Category[]> {
    const mockCategories = [
      {
        name: 'อิเล็กทรอนิกส์',
        description: 'อุปกรณ์อิเล็กทรอนิกส์และเทคโนโลยี',
      },
      { name: 'เสื้อผ้า', description: 'เสื้อผ้าแฟชั่นและเครื่องแต่งกาย' },
      {
        name: 'อาหารและเครื่องดื่ม',
        description: 'อาหารสำเร็จรูปและเครื่องดื่ม',
      },
      { name: 'ของใช้ในบ้าน', description: 'เครื่องใช้ไฟฟ้าและของใช้ในบ้าน' },
      { name: 'กีฬาและกิจกรรม', description: 'อุปกรณ์กีฬาและกิจกรรมกลางแจ้ง' },
      {
        name: 'หนังสือและสื่อ',
        description: 'หนังสือ นิตยสาร และสื่อการเรียนรู้',
      },
      { name: 'เครื่องสำอาง', description: 'เครื่องสำอางและผลิตภัณฑ์ดูแลผิว' },
      { name: 'ของเล่น', description: 'ของเล่นเด็กและของสะสม' },
      { name: 'เฟอร์นิเจอร์', description: 'เฟอร์นิเจอร์และของตกแต่งบ้าน' },
      { name: 'ยานพาหนะ', description: 'อุปกรณ์และอะไหล่ยานพาหนะ' },
      { name: 'สุขภาพและความงาม', description: 'ผลิตภัณฑ์สุขภาพและความงาม' },
      { name: 'สัตว์เลี้ยง', description: 'อาหารและอุปกรณ์สำหรับสัตว์เลี้ยง' },
      { name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์งาน' },
      { name: 'ของขวัญ', description: 'ของขวัญและของที่ระลึก' },
      { name: 'คอมพิวเตอร์', description: 'อุปกรณ์คอมพิวเตอร์และอุปกรณ์เสริม' },
      {
        name: 'มือถือและแท็บเล็ต',
        description: 'สมาร์ทโฟน แท็บเล็ต และอุปกรณ์เสริม',
      },
      { name: 'กล้องและอุปกรณ์ถ่ายภาพ', description: 'กล้องและอุปกรณ์ถ่ายภาพ' },
      { name: 'เครื่องดนตรี', description: 'เครื่องดนตรีและอุปกรณ์เสียง' },
      { name: 'เกมและคอนโซล', description: 'เกมและคอนโซลเกม' },
      { name: 'ของใช้สำนักงาน', description: 'อุปกรณ์สำนักงานและเครื่องเขียน' },
    ];

    // Get existing codes to avoid duplicates
    const existingCategories = await this.categoryModel
      .find({}, { code: 1 })
      .exec();
    const existingCodes = new Set(existingCategories.map((cat) => cat.code));

    // Find the highest number in existing codes
    let maxNumber = 0;
    existingCodes.forEach((code) => {
      const match = code.match(/^CAT-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    // Generate unique codes
    const categoriesToCreate: Array<{
      name: string;
      description?: string;
      code: string;
      active: boolean;
    }> = [];
    let currentNumber = maxNumber + 1;

    for (let i = 0; i < count && i < mockCategories.length; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = `CAT-${String(currentNumber).padStart(6, '0')}`;
        currentNumber++;
        attempts++;
        if (attempts > 1000) {
          // Fallback to timestamp if too many attempts
          code = `CAT-${Date.now()}-${i}`;
          break;
        }
      } while (existingCodes.has(code));

      existingCodes.add(code);
      categoriesToCreate.push({
        ...mockCategories[i],
        code,
        active: true,
      });
    }

    const createdCategories =
      await this.categoryModel.insertMany(categoriesToCreate);
    return createdCategories;
  }
}
