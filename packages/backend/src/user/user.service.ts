import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExistsDto from '../auth/dto/exists.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async updateUser(userId: string, data: UpdateUserDto) {
    return this.userRepository.update(userId, data);
  }

  async findUserByAddress(address: string) {
    return this.userRepository.findOne({
      where: { address },
    });
  }
  async findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async userExists(payload: ExistsDto) {
    return this.userRepository.createQueryBuilder().orWhere(payload).getOne();
  }

  async findUserByID(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }
}
