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
import { DonationPoolKind } from '../types';

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
  @IsInt()
  chain_id?: number;

  @IsOptional()
  @IsString()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];
}
