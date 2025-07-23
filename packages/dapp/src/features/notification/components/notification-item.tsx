import { DropdownMenuItem } from "@shared/ui/dropdown-menu.tsx"
import { clsx } from "clsx"
import { CheckIcon } from "lucide-react"
import { setAsRead } from "@features/notification/store/notification.ts"
import { useAppDispatch } from "@core/store"
import { useMarkAsReadMutation } from "@features/notification/services/notification-api.ts"
import { NotificationType } from "@features/notification/types"

interface NotificationItemProps {
  is_read: boolean
  id: string
  title: string
  message: string
  type: NotificationType
}

export default function NotificationItem(props: NotificationItemProps) {
  const appDispatch = useAppDispatch()
  const [markAsReadMutation] = useMarkAsReadMutation()
  const handleNotificationClick = (id: string) => {
    return () => {
      markAsReadMutation(id)
      appDispatch(setAsRead(id))
    }
  }
  return (
    <DropdownMenuItem
      className={clsx(
        !props.is_read ? "dark:bg-gray-200/5 bg-gray-200" : "",
        "cursor-pointer my-1",
      )}
      key={props.id}
      onClick={!props.is_read ? handleNotificationClick(props.id) : undefined}
    >
      {props.type === "on_chain" ? (
        <CheckIcon className="stroke-green-400" />
      ) : null}
      <div>
        <h3 className="text-sm block font-bold">{props.title}</h3>
        <p>{props.message}</p>
      </div>
    </DropdownMenuItem>
  )
}
