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
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProfileService {
  logger = new Logger('ProfileService');

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheService: CacheManagerStore,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sends a verification email to the user if their email is not already verified.
   *
   * Validates the presence and verification status of the email, then generates a
   * verification code and sends it via the mail service.
   *
   * @param profile – A partial ProfileEntity containing at least the email (and optionally display name).
   * @returns boolean - If everything works out.
   * @throws UnprocessableEntityException if the email is missing or already verified.
   */
  async sendVerificationEmail(profile: Partial<ProfileEntity>) {
    this.logger.log('Sending verification email');
    if (!profile.email) {
      throw new UnprocessableEntityException('Email address is required');
    }
    if (profile.email_verified) {
      throw new UnprocessableEntityException(
        'The email address is already verified',
      );
    }
    const code = await this.generateVerificationCode(profile.email);
    const isTestMode = this.configService.get<string>('NODE_ENV') === 'test';
    if (!isTestMode) {
      await this.mailService.sendEmailVerification(profile.email, {
        expiresIn: '5 Minutes',
        code,
        name: profile.display_name ?? profile.email?.split('@')[0],
      });
      return true;
    } else {
      return code;
    }
  }

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
    this.logger.log('Generated a verification Code for user');
    this.logger.log('Verification code:', code);
    this.logger.log('Profile email:', email);
    this.logger.log('=======================================');
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
   * Verifies the user's email using a verification code and updates their profile accordingly.
   *
   * @param email – The email address associated with the profile to be verified.
   * @param code – The verification code to validate against the cached entry.
   *
   * @throws NotFoundException if the code is missing or expired.
   * @throws BadRequestException if the code is invalid.
   */
  async verifyEmail(email: string, code: string) {
    const valid = await this.verifyVerificationCode(email, code);

    await this.profileRepository.update(
      {
        email,
      },
      {
        email_verified: valid,
      },
    );

    // Delete the code, because is no longer needed
    await this.cacheService.del(email);
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
