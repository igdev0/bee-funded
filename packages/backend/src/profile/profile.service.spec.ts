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
      displayName: 'Some displayName',
      username: 'userName',
      email: 'userEmail',
      socialLinks: ['https://linkedin.com/in/some-uuid'],
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
});
