import { Injectable } from '@nestjs/common';
import { CreateDonationPoolDto } from './dto/create-donation-pool.dto';
import { UpdateDonationPoolDto } from './dto/update-donation-pool.dto';
import { Repository } from 'typeorm';
import {
  DonationPool,
  DonationPoolStatus,
} from './entities/donation-pool.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DonationPoolService {
  constructor(
    @InjectRepository(DonationPool)
    private donationPoolRepository: Repository<DonationPool>,
  ) {}

  create(userId: string, createDonationPoolDto: CreateDonationPoolDto) {
    const pool = this.donationPoolRepository.create({
      ...createDonationPoolDto,
      user: userId,
      status: DonationPoolStatus.PENDING,
    });
    return this.donationPoolRepository.save(pool);
  }

  findAll() {
    return this.donationPoolRepository.find();
  }

  findOwnedByChainId(id: number, userId: string) {
    return this.donationPoolRepository.findOne({
      where: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        user: { id: userId },
        on_chain_pool_id: id,
      },
      relations: ['user'],
    });
  }

  findAllByUserId(userId: string) {
    return this.donationPoolRepository.find({
      where: {
        user: userId,
      },
    });
  }

  findMain(userId: string) {
    return this.donationPoolRepository.findOne({
      where: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        user: { id: userId },
        main: true,
      },
      relations: ['user'],
    });
  }

  findOne(id: string) {
    return this.donationPoolRepository.findOneBy({
      id,
    });
  }

  update(id: string, updateDonationPoolDto: UpdateDonationPoolDto) {
    return this.donationPoolRepository.update(
      { id },
      {
        ...updateDonationPoolDto,
        status: updateDonationPoolDto.status
          ? updateDonationPoolDto.status
          : DonationPoolStatus.CREATED,
      },
    );
  }
}
