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

  /**
   * It updates the profile database and returns the ProfileEntity
   * @param profileId – The profile id obtained from user.profile.id
   * @param updateProfileDto - The data that must be updated.
   * @returns Promise<ProfileEntity> - Needed to make updates on the frontend state.
   */
  async update(profileId: string, updateProfileDto: UpdateProfileDto) {
    await this.profileRepository.update(profileId, updateProfileDto);
    return this.profileRepository.findOne({ where: { id: profileId } });
  }

  /**
   * Gets the profile
   * @param id – The profile id obtained from user.profile.id
   */
  getProfile(id: string): Promise<ProfileEntity | null> {
    return this.profileRepository.findOne({ where: { id } });
  }
}
