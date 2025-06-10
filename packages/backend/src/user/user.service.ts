import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExistsDto from '../auth/dto/exists.dto';

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

  async userExists(payload: ExistsDto) {
    if (payload.address) {
      return await this.findUserByAddress(payload.address);
    } else if (payload.username) {
      return this.findUserByUsername(payload.username);
    } else if (payload.email) {
      return this.findUserByEmail(payload.email);
    }

    throw new NotFoundException();
  }

  async findUserByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }

  async findUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findUserByID(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }
}
