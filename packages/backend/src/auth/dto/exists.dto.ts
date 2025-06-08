import { IsString } from 'class-validator';

export default class ExistsDto {
  @IsString()
  address: string;

}