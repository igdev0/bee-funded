import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import ProfileEntity from '../profile/entities/profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    user.profile = new ProfileEntity();
    user.profile.cover = '/default/cover.png';
    user.profile.avatar = '/default/avatar.png';
    return this.userRepository.save(user);
  }

  findOneById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relationLoadStrategy: 'join',
      relations: ['profile'],
    });
  }

  findOneByWalletAddress(walletAddress: string) {
    return this.userRepository.findOne({
      where: { wallet_address: walletAddress },
      relationLoadStrategy: 'join',
      relations: ['profile'],
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}
