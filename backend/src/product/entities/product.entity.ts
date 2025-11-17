import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ default: true, description: 'The status of the product' })
  active!: boolean;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    description: 'The code of the product',
  })
  code!: string;

  @Prop({ required: true, trim: true, description: 'The name of the product' })
  name!: string;

  @Prop({ trim: true, description: 'The description of the product' })
  description?: string;

  @Prop({ required: true, min: 0, description: 'The price of the product' })
  price!: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
    description: 'The quantity of the product',
  })
  quantity!: number;

  @Prop({
    sparse: true,
    trim: true,
    description: 'The SKU of the product',
  })
  sku?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
    description: 'The category of the product',
  })
  category!: Types.ObjectId;

  @Prop({ description: 'The image URL of the product' })
  imageUrl?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
