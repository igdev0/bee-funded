import {defaultClient} from '@/api/auth.ts';

export default function getNotifications() {
  return defaultClient.get("/notifications");
}