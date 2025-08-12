import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';

// 1. NotificationTypes DTO
export class NotificationTypesDto {
  @IsBoolean()
  newFollower: boolean;

  @IsBoolean()
  donationPoolCreation: boolean;

  @IsBoolean()
  followersPoolCreation: boolean;
}

// 2. NotificationChannel DTO
export class NotificationChannelDto {
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;

  @ValidateNested()
  @Type(() => NotificationTypesDto)
  notifications: NotificationTypesDto;
}

// 3. NotificationSettingsChannels DTO
export class NotificationSettingsChannelsDto {
  @ValidateNested()
  @Type(() => NotificationChannelDto)
  email: NotificationChannelDto;

  @ValidateNested()
  @Type(() => NotificationChannelDto)
  inApp: NotificationChannelDto;
}

// 4. Main NotificationSettings DTO
export class NotificationSettingsDto {
  @ValidateNested()
  @Type(() => NotificationSettingsChannelsDto)
  channels: NotificationSettingsChannelsDto;
}
