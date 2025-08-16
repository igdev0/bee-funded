import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export interface NotificationConfigI {
  settingsPath: string;
}

export default registerAs(
  'notification',
  () =>
    ({
      settingsPath:
        process.env.NOTIFICATION_SETTINGS_PATH ?? '/settings/notifications', // The path which frontend will use to render the config,
    }) as NotificationConfigI,
);
