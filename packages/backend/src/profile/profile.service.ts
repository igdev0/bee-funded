import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
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

  /**
   * It follows a profile
   * @param followerId – The profile id of the person who is following someone else.
   * @param followeeId – The profile id of the person who is being followed.
   */
  async follow(followerId: string, followeeId: string) {
    const followerProfile = await this.profileRepository.findOneOrFail({
      where: { id: followerId },
      relationLoadStrategy: 'query',
      relations: ['following'],
    });
    if (followerId === followeeId) {
      throw new UnprocessableEntityException('You cannot follow yourself');
    }

    if (!followerProfile.following.some((p) => p.id === followeeId)) {
      await this.profileRepository
        .createQueryBuilder()
        .relation(ProfileEntity, 'following')
        .of(followerId)
        .add(followeeId);
    }

    return true;
  }

  /**
   * It unfollows a profile
   * @param followerId – The profile id of the person who is following someone else.
   * @param followeeId – The profile id of the person who is being followed.
   */
  async unfollow(followerId: string, followeeId: string) {
    const followerProfile = await this.profileRepository.findOneOrFail({
      where: { id: followerId },
      relationLoadStrategy: 'query',
      relations: ['following'],
    });

    if (followerId === followeeId) {
      throw new UnprocessableEntityException('You cannot unfollow yourself');
    }

    if (!followerProfile.following.some((p) => p.id === followeeId)) {
      await this.profileRepository
        .createQueryBuilder()
        .relation(ProfileEntity, 'following')
        .of(followerId)
        .remove(followeeId);
    }
    return true;
  }
}
