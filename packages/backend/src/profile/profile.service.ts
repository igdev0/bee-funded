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
   * It follows a profile
   * @param followerId – The profile id of the person who is following someone else.
   * @param followeeId – The profile id of the person who is being followed.
   */
  async follow(followerId: string, followeeId: string) {
    const followerProfile = await this.profileRepository.findOneOrFail({
      where: { id: followerId },
    });
    const followeeProfile = await this.profileRepository.findOneOrFail({
      where: { id: followeeId },
    });

    const currentFollowing = followerProfile.following;
    const isAlreadyFollowing = currentFollowing.some(
      (p) => p.id === followeeId,
    );

    if (!isAlreadyFollowing) {
      currentFollowing.push({ id: followeeId } as ProfileEntity);
      await this.profileRepository.update(followerId, {
        following: currentFollowing,
      });
    }

    // Update "followers" list
    const currentFollowers = followeeProfile.followers;
    const isAlreadyFollowed = currentFollowers.some((p) => p.id === followerId);

    if (!isAlreadyFollowed) {
      currentFollowers.push({ id: followerId } as ProfileEntity);
      await this.profileRepository.update(followeeId, {
        followers: currentFollowers,
      });
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
    });
    const followeeProfile = await this.profileRepository.findOneOrFail({
      where: { id: followeeId },
    });

    if (followerProfile.following.some((p) => p.id === followeeId)) {
      await this.profileRepository.update(followerId, {
        following: followerProfile.following.filter((p) => p.id !== followeeId),
      });
    }

    // Update "followers" list

    if (followeeProfile.followers.some((p) => p.id === followerId)) {
      await this.profileRepository.update(followeeId, {
        followers: followeeProfile.followers.filter((p) => p.id !== followerId),
      });
    }
    return true;
  }
}
