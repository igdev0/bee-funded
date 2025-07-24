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

  /**
   *
   * @param folowerId – The profile id of the person who is following someone else.
   * @param foloweeId – The profile id of the person who is being followed.
   */
  async follow(folowerId: string, foloweeId: string) {
    const followerProfile = await this.profileRepository.findOneOrFail({
      where: { id: folowerId },
    });
    const followeeProfile = await this.profileRepository.findOneOrFail({
      where: { id: foloweeId },
    });

    // Update "following" list
    const currentFollowing = followerProfile.following || [];
    const isAlreadyFollowing = currentFollowing.some((p) => p.id === foloweeId);

    if (!isAlreadyFollowing) {
      currentFollowing.push({ id: foloweeId } as ProfileEntity);
      await this.profileRepository.update(folowerId, {
        following: currentFollowing,
      });
    }

    // Update "followers" list
    const currentFollowers = followeeProfile.followers || [];
    const isAlreadyFollowed = currentFollowers.some((p) => p.id === folowerId);

    if (!isAlreadyFollowed) {
      currentFollowers.push({ id: folowerId } as ProfileEntity);
      await this.profileRepository.update(foloweeId, {
        followers: currentFollowers,
      });
    }
  }
}
