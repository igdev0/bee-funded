import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  preferencesPath: '/settings/notifications', // The path which frontend will use to render the config,
}));
