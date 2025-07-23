import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import ProfileEntity from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  logger = new Logger('ProfileService');

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async update(profileId: string, updateProfileDto: UpdateProfileDto) {
    await this.profileRepository.update(profileId, updateProfileDto);
    return this.profileRepository.findOne({ where: { id: profileId } });
  }
}
