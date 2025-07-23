import { CreateProfileDto } from './create-profile.dto';
import { PartialType } from '@nestjs/mapped-types';

export default class UpdateProfileDto extends PartialType(CreateProfileDto) {}
