import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainConfig } from '../contracts.config';
import { Contract, WebSocketProvider } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationPoolEntity } from './entities/donation-pool.entity';
import { Repository } from 'typeorm';
import CreateDonationPoolDto from './dto/create-donation-pool.dto';
import UpdateDonationPoolDto from './dto/update-donation-pool.dto';
import PublishDonationPoolDto from './dto/publish-donation-pool.dto';

@Injectable()
export class DonationPoolService implements OnModuleInit, OnModuleDestroy {
  private providers: WebSocketProvider[] = [];

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(DonationPoolEntity)
    private readonly donationPoolRepository: Repository<DonationPoolEntity>,
  ) {}

  /**
   * The create function handles the creation of a donation pool the first step in the process.
   *
   * Requirements:
   * - It should set the status to "publishing"
   * - It should ignore any other inputs if the kind is set to 'main'.
   *
   * @param dto – CreateDonationPoolDto
   * @param profileId – The profile owning this donation pool
   */
  async create(
    dto: CreateDonationPoolDto,
    profileId: string,
  ): Promise<DonationPoolEntity> {
    let entity: DonationPoolEntity;
    if (dto.kind == 'main') {
      entity = this.donationPoolRepository.create({
        kind: 'main',
        profile: { id: profileId },
        status: 'publishing',
      });
    } else {
      entity = this.donationPoolRepository.create({
        ...dto,
        profile: { id: profileId },
        status: 'publishing',
      });
    }
    return await this.donationPoolRepository.save(entity);
  }

  async publish(
    id_hash: string,
    dto: PublishDonationPoolDto,
  ): Promise<DonationPoolEntity> {
    await this.donationPoolRepository
      .createQueryBuilder()
      .update()
      .set({
        on_chain_id: dto.on_chain_id,
        owner_address: dto.owner_address,
        status: 'published',
      })
      .where('id_hash = :id_hash', { id_hash })
      .execute();
    return this.donationPoolRepository.findOneByOrFail({
      id_hash,
    });
  }

  /**
   * It updates any donation pool that is created as a objective
   * @param id – Donation
   * @param profileId – The profile id of the authenticated user.
   * @param data – The data to be updated
   */
  async update(
    id: string,
    profileId: string,
    data: UpdateDonationPoolDto,
  ): Promise<DonationPoolEntity> {
    await this.donationPoolRepository
      .createQueryBuilder()
      .update()
      .set(data)
      .where('id = :id', { id })
      .andWhere('profileId = :profileId', { profileId })
      .andWhere('kind = :kind', { kind: 'objective' })
      .execute();
    return this.donationPoolRepository.findOneOrFail({ where: { id: id } });
  }

  /**
   * This method allows you to get owned donation pool by ID.
   * @param id – The donation pool ID
   * @param profileId – The profileId owning the given donation pool ID
   */
  getOwned(id: string, profileId: string): Promise<DonationPoolEntity> {
    return this.donationPoolRepository
      .createQueryBuilder('pool')
      .leftJoin('pool.profile', 'profile')
      .where('profile.id = :profileId', { profileId })
      .andWhere('pool.id = :id', { id })
      .getOneOrFail();
  }

  /**
   * This method gets all donation pools owned by a profileId
   * @param profileId – The profile id of the user owning pools
   */
  getAllOwned(profileId: string): Promise<DonationPoolEntity[]> {
    return this.donationPoolRepository
      .createQueryBuilder()
      .where('profileId = :profileId', { profileId })
      .getMany();
  }

  /**
   * This method handles the removal of a donation pool
   * @param id – The id of the donation pool entity
   * @param profileId – The profile id of the user owning the donation pool.
   */

  async deleteOwned(id: string, profileId: string): Promise<boolean> {
    const result = await this.donationPoolRepository
      .createQueryBuilder()
      .where('id = :id', { id })
      .andWhere('profileId = :profileId', { profileId })
      .delete()
      .execute();
    if (result.affected) {
      return result.affected > 0;
    }
    return false;
  }

  async onModuleInit(): Promise<void> {
    const chains = this.config.get<ChainConfig[]>('contracts');
    if (!chains) {
      throw new Error('Contracts config must be set');
    }

    for (const chain of chains) {
      const provider = new WebSocketProvider(chain.wsUrl);
      this.providers.push(provider);
      const { abi: beeFundedCoreAbi, address: beeFundedCoreAddress } =
        chain.contracts.BeeFundedCore;

      const contract = new Contract(
        beeFundedCoreAddress,
        beeFundedCoreAbi,
        provider,
      );

      await contract.on(
        'DonationPoolCreated',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (on_chain_id: bigint, owner_address: string, id_hash: bigint) => {
          await this.publish(`0x${id_hash.toString(16)}`, {
            on_chain_id,
            owner_address,
          });
        },
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    const chains = this.config.get<ChainConfig[]>('contracts');
    if (!chains) {
      throw new Error('Contracts config must be set');
    }
    await Promise.all(
      this.providers.map((provider) => {
        return provider.destroy();
      }),
    );
  }
}
