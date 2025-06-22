import { IsBoolean, IsString } from 'class-validator';

export class CreateDonationPoolDto {
  @IsString()
  title: string;
  @IsString()
  description: string;
  @IsBoolean()
  main?: boolean;
}
