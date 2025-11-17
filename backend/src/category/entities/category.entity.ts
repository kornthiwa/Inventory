import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ default: true, description: 'The status of the category' })
  active!: boolean;

  @Prop({
    required: true,
    trim: true,
    description: 'The name of the category',
  })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    description: 'The code of the category',
  })
  code!: string;

  @Prop({ trim: true })
  description?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
