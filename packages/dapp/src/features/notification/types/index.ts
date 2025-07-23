export type NotificationType = "system" | "on_chain" | "custom"

export interface NotificationI {
  id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  metadata: JSON
  created_at: Date
  updated_at: Date
}

export interface NotificationResponse {
  data: NotificationI[]
  limit: number
  count: number
  offset: number
}

export interface GetNotificationsArgs {
  limit: number
  offset: number
}
