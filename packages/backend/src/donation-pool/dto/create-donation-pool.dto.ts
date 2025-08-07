import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  IsInt,
  Min,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { DonationPoolKind, DonationPoolStatus } from '../types';

export default class CreateDonationPoolDto {
  @IsEnum(['main', 'objective'])
  kind: DonationPoolKind;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  valuation_token?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cap?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['draft', 'publishing', 'published', 'failed'])
  status?: DonationPoolStatus;
}
