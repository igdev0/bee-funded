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
import { ProfileService } from '../profile/profile.service';
import { NotificationService } from '../notification/notification.service';
import { MailService, NotificationContext } from '../mail/mail.service';
import ProfileEntity from '../profile/entities/profile.entity';
import {
  NotificationI,
  SaveNotificationI,
} from '../notification/notification.interface';

@Injectable()
export class DonationPoolService implements OnModuleInit, OnModuleDestroy {
  private providers: WebSocketProvider[] = [];

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(DonationPoolEntity)
    private readonly donationPoolRepository: Repository<DonationPoolEntity>,
    private readonly profileService: ProfileService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
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
    return this.donationPoolRepository.findOneOrFail({
      where: { id_hash },
      relations: ['profile'],
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

  /**
   * Lifecycle hook called when the module is initialized.
   *
   * Sets up WebSocket providers for each configured blockchain network and
   *  subscribe to the `DonationPoolCreated` event on the BeeFundedCore contract.
   *
   * @remarks
   * - Fetches chain configurations from the application config (`contracts` key).
   * - Throws an error if no chain configurations are found.
   * - For each chain, it:
   *   1. Creates a WebSocketProvider and stores it in `this.providers`.
   *   2. Instantiates the BeeFundedCore contract using its ABI and address.
   *   3. Subscribe to the `DonationPoolCreated` event, invoking `onDonationCreated` when triggered.
   */
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/unbound-method
        this.onDonationCreated,
      );
    }
  }

  /**
   * Lifecycle hook called when the module is being destroyed.
   *
   * Cleans up all WebSocket providers that were initialized during `onModuleInit`.
   *
   * @remarks
   * - Fetches chain configurations from the application config (`contracts` key) to ensure chains are set.
   * - Throws an error if no chain configurations are found.
   * - Calls `destroy()` on each WebSocketProvider in `this.providers` to properly close connections.
   * - Use `Promise.all` to wait for all providers to be destroyed concurrently.
   */
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

  /**
   * Event handler triggered when a new donation pool is created on-chain.
   *
   * This method processes and sends notifications to both the actor (creator)
   * and their followers based on their notification settings.
   *
   * @param on_chain_id – The on-chain ID of the newly created donation pool.
   * @param owner_address – The blockchain address of the actor who created the pool.
   * @param id_hash – The hash ID of the donation pool (used to fetch and publish the pool entity).
   *
   * @remarks
   * Steps performed by this method:
   * 1. Call `publish` to update the donation pool entity with on-chain data and retrieve the actor profile.
   * 2. Prepares in-app and email notifications for the actor and sends them using `processActorNotifications`.
   * 3. Prepares in-app and email notifications for followers and sends them using `processFollowersNotifications`.
   * 4. Placeholders like `{display_name}` in follower messages are meant to be replaced before sent to the user.
   */
  private async onDonationCreated(
    on_chain_id: bigint,
    owner_address: string,
    id_hash: bigint,
  ) {
    const { profile: actorProfile } = await this.publish(
      `0x${id_hash.toString(16)}`,
      {
        on_chain_id,
        owner_address,
      },
    );

    const actorMessage: SaveNotificationI = {
      type: 'donation_pool_created',
      title: 'Donation pool created',
      actor: actorProfile,
      message: 'Your donation pool was created',
      metadata: {},
    };

    const emailMessage: NotificationContext = {
      notificationsSettingsUrl: '/', // @todo: Update this to the settings url
      name: actorProfile.display_name ?? '',
      actorDisplayName: actorProfile.display_name ?? '',
      actionUrl: '/', // @todo: Update this to the action URL
      actorImage: actorProfile.avatar,
      notificationMessage: `Your donation pool was created`,
    };
    // 1. Process notifications for an actor
    await this.notificationService.processActorNotifications(
      actorProfile,
      actorMessage,
      emailMessage,
    );

    const followerMessage: SaveNotificationI = {
      type: 'donation_pool_created',
      title: '{display_name} Launched a Pool!',
      actor: actorProfile,
      message:
        '{display_name} just launched a new donation pool! Check it out and show your support!',
      metadata: {},
    };

    const followerMailMessage = {
      notificationsSettingsUrl: '/', // @todo: Update this to the settings url
      actorDisplayName: actorProfile.display_name ?? '',
      actionUrl: '/', // @todo: Update this to the action URL
      actorImage: actorProfile.avatar,
      notificationMessage: `User {} has created a new donation pool!`,
    };

    await this.notificationService.processFollowersNotifications(
      actorProfile,
      followerMessage,
      followerMailMessage,
    );
  }
}
