import { Mocked, TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(UserService).compile();
    userService = unit;
    userRepository = unitRef.get('UserEntityRepository');
  });

  afterEach(() => {
    // Clear all mocks after each test to ensure test isolation
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const createUserDto: CreateUserDto = {
        wallet_address: '0x123abc',
      };
      const createdUser = { id: '1', ...createUserDto } as UserEntity;

      // Mock the behavior of userRepository.create
      userRepository.create.mockReturnValue(createdUser);
      // Mock the behavior of userRepository.save
      userRepository.save.mockResolvedValue(createdUser);

      const result = await userService.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findOneById', () => {
    it('should find a user by ID', async () => {
      const userId = 'some-uuid-1';
      const foundUser = {
        id: userId,
        wallet_address: '0x456def',
      } as UserEntity;

      // Mock the behavior of userRepository.findOne
      userRepository.findOne.mockResolvedValue(foundUser);

      const result = await userService.findOneById(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(foundUser);
    });

    it('should return null if user not found by ID', async () => {
      const userId = 'non-existent-id';
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.findOneById(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBeNull();
    });
  });

  describe('findOneByWalletAddress', () => {
    it('should find a user by wallet address', async () => {
      const walletAddress = '0xabc123';
      const foundUser = {
        id: 'some-uuid-2',
        wallet_address: walletAddress,
      } as UserEntity;

      userRepository.findOne.mockResolvedValue(foundUser);

      const result = await userService.findOneByWalletAddress(walletAddress);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { wallet_address: walletAddress },
      });
      expect(result).toEqual(foundUser);
    });

    it('should return null if user not found by wallet address', async () => {
      const walletAddress = 'non-existent-wallet';
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.findOneByWalletAddress(walletAddress);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { wallet_address: walletAddress },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should should update user wallet address', async () => {
      const walletAddress = '0x123abc';
      const id = 'some-uuid-1';
      const mockedResult = { affected: 1, raw: [], generatedMaps: [] }; // TypeORM UpdateResult
      userRepository.update.mockResolvedValue(mockedResult);

      const result = await userService.update(id, {
        wallet_address: walletAddress,
      });

      expect(userRepository.update).toHaveBeenCalledWith(id, {
        wallet_address: walletAddress,
      });

      expect(result).toEqual(mockedResult);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = 'remove-uuid';
      const deleteResult = { affected: 1, raw: [] }; // TypeORM DeleteResult

      userRepository.delete.mockResolvedValue(deleteResult);

      const result = await userService.remove(userId);

      expect(userRepository.delete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(deleteResult);
    });
  });
});
