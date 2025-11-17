import {
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number | undefined;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number | undefined;

  @IsOptional()
  @IsString()
  search?: string | undefined;

  @IsOptional()
  @IsString()
  category?: string | undefined;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean | undefined;
}
