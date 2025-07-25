import { ProfileService } from './profile.service';
import { Mocked, TestBed } from '@suites/unit';
import { Repository } from 'typeorm';
import ProfileEntity from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: Mocked<Repository<ProfileEntity>>;
  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(ProfileService).compile();
    service = unit;
    profileRepository = unitRef.get('ProfileEntityRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
    await service.getProfile(profileId);
    expect(profileRepository.findOne).toHaveBeenCalledWith({
      where: { id: profileId },
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
    profileRepository.findOneOrFail
      .mockResolvedValueOnce(followerProfile as unknown as ProfileEntity)
      .mockResolvedValueOnce(followeeProfile as unknown as ProfileEntity);

    await service.follow(followerProfile.id, followeeProfile.id);

    expect(profileRepository.update).toHaveBeenCalledWith(followerProfile.id, {
      following: [{ id: followeeProfile.id }],
    });

    expect(profileRepository.update).toHaveBeenCalledWith(followeeProfile.id, {
      followers: [{ id: followerProfile.id }],
    });
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
      followers: [
        { id: 'some-follower-profile-uuid' },
        { id: 'some-other-follower' },
      ],
    };
    profileRepository.findOneOrFail
      .mockResolvedValueOnce(followerProfile as unknown as ProfileEntity)
      .mockResolvedValueOnce(followeeProfile as unknown as ProfileEntity);

    await service.unfollow(followerProfile.id, followeeProfile.id);

    expect(profileRepository.update).toHaveBeenCalledWith(followerProfile.id, {
      following: [],
    });

    expect(profileRepository.update).toHaveBeenCalledWith(followeeProfile.id, {
      followers: [{ id: 'some-other-follower' }],
    });
  });
});
