import { ProfileService } from './profile.service';
import { Mocked, TestBed } from '@suites/unit';
import { Repository, SelectQueryBuilder } from 'typeorm';
import ProfileEntity from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CacheManagerStore } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: Mocked<Repository<ProfileEntity>>;
  let cacheService: Mocked<CacheManagerStore>;
  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(ProfileService).compile();
    service = unit;
    profileRepository = unitRef.get('ProfileEntityRepository');
    cacheService = unitRef.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should look up the database to find if a username is taken', async () => {
    profileRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ username: 'igdev' } as ProfileEntity);
    let taken = await service.usernameTaken('igdev');
    expect(profileRepository.findOne).toHaveBeenCalledWith({
      where: { username: 'igdev' },
    });

    expect(taken).toBeFalsy();
    taken = await service.usernameTaken('igdev');
    expect(taken).toBeTruthy();
  });

  describe('sending verification email', () => {
    it('if the email is not passed as prop, it should throw UnprocessableEntityException', async () => {
      await expect(
        service.sendVerificationEmail({ email_verified: true }),
      ).rejects.toThrow(
        new UnprocessableEntityException('Email address is required'),
      );
    });

    it('if the email_verified is true, it should throw UnprocessableEntityException', async () => {
      await expect(
        service.sendVerificationEmail({
          email: 'email@gmail.com',
          email_verified: true,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'The email address is already verified',
        ),
      );
    });
    it('should call sendEmailVerification with email and context', async () => {
      await expect(
        service.sendVerificationEmail({
          email: 'email@gmail.com',
          email_verified: false,
        }),
      ).resolves.toBeTruthy();
    });
  });

  it('should be able to generate verification code and cache it', async () => {
    const code = await service.generateVerificationCode('test@gmail.com');
    expect(code).toBeDefined();
    expect(code.length).toEqual(5);
    expect(cacheService.set).toHaveBeenCalledWith('test@gmail.com', code, 300);
  });

  describe('Verifying a email verification code', () => {
    it('should throw NotFoundException if the cache does not have the code', async () => {
      await expect(
        service.verifyVerificationCode('d@gm.com', 'a1cde'),
      ).rejects.toThrow(
        new NotFoundException(
          'The verification code does not exist, or it expired',
        ),
      );
    });

    it('should throw BadRequestException if the codes mismatch', async () => {
      cacheService.get.mockResolvedValue('a1cde');

      await expect(
        service.verifyVerificationCode('d@gm.com', 'b1cde'),
      ).rejects.toThrow(
        new BadRequestException('Verification code is incorrect'),
      );
    });

    it('should return true if the code is valid', async () => {
      cacheService.get.mockResolvedValue('a1cde');
      await expect(
        service.verifyVerificationCode('d@gm.com', 'a1cde'),
      ).resolves.toBeTruthy();
    });
  });

  it('should verify email and update the database', async () => {
    cacheService.get.mockResolvedValue('a1cde');
    await service.verifyEmail('d@g.com', 'a1cde');
    expect(profileRepository.update).toHaveBeenCalledWith(
      { email: 'd@g.com' },
      { email_verified: true },
    );
  });

  it('should update profile database and return the new ProfileEntity', async () => {
    const profileId = 'some-uuid';
    const update: UpdateProfileDto = {
      bio: 'Some bio',
      display_name: 'Some displayName',
      username: 'userName',
      email: 'userEmail',
      social_links: ['https://linkedin.com/in/some-uuid'],
    };
    await service.update(profileId, update);

    expect(profileRepository.update).toHaveBeenCalledWith(profileId, update);
    expect(profileRepository.findOne).toHaveBeenCalledWith({
      where: { id: profileId },
    });
  });

  it('should be able to get profile', async () => {
    const profileId = 'some-uuid';
    await service.getProfile(profileId, {});
    expect(profileRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: profileId },
      select: {},
    });
  });

  it('should be able to follow a profile', async () => {
    const followerProfile = {
      id: 'some-follower-profile-uuid',
      following: [],
      followers: [],
    };

    const followeeProfile = {
      id: 'some-followee-profile-uuid',
      following: [],
      followers: [],
    };
    const mockAdd = jest.fn();
    const mockOf = jest.fn().mockReturnValue({ add: mockAdd });
    const mockRelation = jest.fn().mockReturnValue({ of: mockOf });
    profileRepository.createQueryBuilder.mockReturnValue({
      // @ts-expect-error test won't run
      relation: mockRelation as unknown as SelectQueryBuilder<ProfileEntity>,
    });
    profileRepository.findOneOrFail
      .mockResolvedValueOnce(followerProfile as unknown as ProfileEntity)
      .mockResolvedValueOnce(followeeProfile as unknown as ProfileEntity);

    const updatedProfile = await service.follow(
      followerProfile.id,
      followeeProfile.id,
    );

    expect(mockOf).toHaveBeenCalledWith(followerProfile.id);
    expect(mockAdd).toHaveBeenCalledWith(followeeProfile.id);
    expect(updatedProfile.following).toEqual([{ id: followeeProfile.id }]);
  });

  it('should be able to unfollow a profile', async () => {
    const followerProfile = {
      id: 'some-follower-profile-uuid',
      following: [{ id: 'some-followee-profile-uuid' }],
      followers: [],
    };

    const followeeProfile = {
      id: 'some-followee-profile-uuid',
      following: [],
      followers: [{ id: 'some-follower-profile-uuid' }],
    };
    const mockRemove = jest.fn();
    const mockOf = jest.fn().mockReturnValue({ remove: mockRemove });
    const mockRelation = jest.fn().mockReturnValue({ of: mockOf });
    profileRepository.createQueryBuilder.mockReturnValue({
      // @ts-expect-error test won't run
      relation: mockRelation as unknown as SelectQueryBuilder<ProfileEntity>,
    });

    profileRepository.findOneOrFail
      .mockResolvedValueOnce(followerProfile as unknown as ProfileEntity)
      .mockResolvedValueOnce(followeeProfile as unknown as ProfileEntity);

    const updatedProfile = await service.unfollow(
      followerProfile.id,
      followeeProfile.id,
    );

    expect(mockOf).toHaveBeenCalledWith(followerProfile.id);
    expect(mockRemove).toHaveBeenCalledWith(followeeProfile.id);
    expect(updatedProfile.following).toEqual([]);
  });
});
