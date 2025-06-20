import { Injectable } from '@nestjs/common';
import { CreateDonationPoolDto } from './dto/create-donation-pool.dto';
import { UpdateDonationPoolDto } from './dto/update-donation-pool.dto';
import { Repository } from 'typeorm';
import { DonationPool } from './entities/donation-pool.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DonationPoolService {
  constructor(
    @InjectRepository(DonationPool)
    private donationPoolRepository: Repository<DonationPool>,
  ) {}

  create(createDonationPoolDto: CreateDonationPoolDto) {
    const pool = this.donationPoolRepository.create(createDonationPoolDto);
    return this.donationPoolRepository.save(pool);
  }

  findAll() {
    return this.donationPoolRepository.find();
  }

  findAllByUserId(userId: string) {
    return this.donationPoolRepository.find({
      where: {
        user: userId,
      },
    });
  }

  findOne(id: string) {
    return this.donationPoolRepository.findOneBy({
      id,
    });
  }

  update(id: string, updateDonationPoolDto: UpdateDonationPoolDto) {
    return this.donationPoolRepository.update({ id }, updateDonationPoolDto);
  }
}
