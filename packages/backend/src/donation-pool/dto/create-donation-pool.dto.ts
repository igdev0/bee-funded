import { IsBoolean, IsString } from 'class-validator';

export class CreateDonationPoolDto {
  @IsString()
  user: string;
  @IsString()
  title: string;
  @IsString()
  description: string;
  @IsBoolean()
  main?: boolean;
}
