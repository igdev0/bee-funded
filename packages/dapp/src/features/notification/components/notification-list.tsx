import { BellIcon } from "lucide-react"
import { Button } from "@shared/ui/button.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu.tsx"
import useNotification from "@features/notification/hooks/use-notification.tsx"
import withAuthenticated from "@shared/hocs/with-authenticated.tsx"
import NotificationLoader from "@features/notification/components/notification-loader.tsx"
import NotificationItem from "@features/notification/components/notification-item.tsx"

function NotificationList() {
  const notifications = useNotification()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Button variant="secondary" className="relative">
          <BellIcon />
          <div className="w-4 h-4 bg-red-600 text-xs absolute -top-1 -right-1 rounded-full text-white select-none">
            {notifications.unreadCount}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="max-h-[500px] h-full">
        {notifications.data.map(notification => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            is_read={notification.is_read}
            id={notification.id}
            title={notification.title}
            message={notification.message}
          />
        ))}
        <NotificationLoader />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default withAuthenticated(NotificationList)
