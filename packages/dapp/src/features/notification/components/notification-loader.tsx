import Spinner from "@shared/ui/spinner.tsx"
import useNotificationsLoader from "@features/notification/hooks/use-notifications-loader.ts"
import { useSelector } from "react-redux"
import { RootState } from "@core/store"

export default function NotificationLoader() {
  const [loader] = useNotificationsLoader()

  const count = useSelector((state: RootState) => state.notificationSlice.count)
  const loadedCount = useSelector(
    (state: RootState) => state.notificationSlice.loadedCount,
  )
  if (count === loadedCount) {
    return null
  }

  return (
    <div ref={loader}>
      <Spinner size="sm" />
    </div>
  )
}
