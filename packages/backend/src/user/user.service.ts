import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async register(userData: User) {
    const user = this.userRepository.create({
      complete: userData.complete,
      address: userData.address,
      email: userData.email,
      username: userData.username,
    });
    return await this.userRepository.save(user);
  }

  async findUserByAddress(address: string) {
    return await this.userRepository.findOne({
      where: {
        address,
      },
    });
  }

  async findUserByID(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }
}
