import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import ProfileEntity from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as crypto from 'node:crypto';
import { CacheManagerStore } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ProfileService {
  logger = new Logger('ProfileService');

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheService: CacheManagerStore,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  /**
   * It generates a verification code and then caches the value for 5 minutes
   * @param email – Profile email to be verified
   * @returns Promise<string> – The generated verification code
   */
  async generateVerificationCode(email: string): Promise<string> {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(5);
    const code = Array.from(bytes)
      .map((byte) => chars[byte % chars.length])
      .join('');

    await this.cacheService.set(email, code, 5 * 60);
    return code;
  }

  /**
   * It verifies the verification code sent to the user by email, or in dev mode to the console.
   * @param email – The profile email obtained from user.profile.email
   * @param code – The code generated using the utility above
   */
  async verifyVerificationCode(email: string, code: string): Promise<boolean> {
    const cachedCode = (await this.cacheService.get(email)) as
      | string
      | undefined;
    if (!cachedCode)
      throw new NotFoundException(
        'The verification code does not exist, or it expired',
      );

    if (cachedCode !== code) {
      throw new BadRequestException('Verification code is incorrect');
    }

    return true;
  }

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
      select: ['id'],
      relations: ['following'],
    });
    if (followerId === followeeId) {
      throw new UnprocessableEntityException('You cannot follow yourself');
    }
    if (followerProfile.following.some((p) => p.id === followeeId)) {
      throw new UnprocessableEntityException('You already follow this profile');
    }
    await this.profileRepository
      .createQueryBuilder()
      .relation(ProfileEntity, 'following')
      .of(followerId)
      .add(followeeId);
    // Update manually the following
    followerProfile.following.push({ id: followeeId } as ProfileEntity);
    return followerProfile;
  }

  /**
   * It unfollows a profile
   * @param followerId – The profile id of the person who is following someone else.
   * @param followeeId – The profile id of the person who is being followed.
   */
  async unfollow(followerId: string, followeeId: string) {
    const followerProfile = await this.profileRepository.findOneOrFail({
      where: { id: followerId },
      select: ['id'],
      relations: ['following'],
    });

    if (followerId === followeeId) {
      throw new UnprocessableEntityException('You cannot unfollow yourself');
    }

    if (!followerProfile.following.some((p) => p.id === followeeId)) {
      throw new UnprocessableEntityException('You do not follow this profile');
    }
    await this.profileRepository
      .createQueryBuilder()
      .relation(ProfileEntity, 'following')
      .of(followerId)
      .remove(followeeId);
    // Update manually the follower ids
    followerProfile.following = followerProfile.following.filter(
      (item) => item.id !== followeeId,
    );
    return followerProfile;
  }
}
