import { useEffect, useRef } from "react"
import {
  EventSourceMessage,
  fetchEventSource,
} from "@microsoft/fetch-event-source"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "@core/store"
import {
  useGetTotalUnreadQuery,
  useLazyGetNotificationsQuery,
} from "@features/notification/services/notification-api.ts"
import {
  addData,
  setData,
  setIsFetching,
  setUnreadCount,
  updateCount,
} from "@features/notification/store/notification.ts"

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL
export default function useNotification() {
  const offset = useSelector(
    (state: RootState) => state.notificationSlice.offset,
  )
  const unreadCount = useSelector(
    (state: RootState) => state.notificationSlice.unreadCount,
  )
  const limit = useSelector((state: RootState) => state.notificationSlice.limit)
  const count = useSelector((state: RootState) => state.notificationSlice.count)
  const [trigger, notifications] = useLazyGetNotificationsQuery()
  const totalUnread = useGetTotalUnreadQuery()
  const data = useSelector((state: RootState) => state.notificationSlice.data)
  const loaderRef = useRef<HTMLButtonElement>(null)
  const appDispatch = useAppDispatch()
  const accessToken = useSelector(
    (state: RootState) => state.authSlice.accessToken,
  )

  useEffect(() => {
    const ctrl = new AbortController()
    if (accessToken) {
      fetchEventSource(`${BACKEND_URL}/notification/sse`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        onmessage: (ev: EventSourceMessage) => {
          const data = ev.data.length > 0 ? JSON.parse(ev.data) : null
          if (data) {
            appDispatch(addData(data))
          }
        },
        onerror(err) {
          if (err instanceof Error) {
            throw err // rethrow to stop the operation
          } else {
            // do nothing to automatically retry. You can also
            // return a specific retry interval here.
          }
        },
        signal: ctrl.signal,
      }).catch(console.error)
    }

    return () => {
      ctrl.abort()
    }
  }, [accessToken])

  useEffect(() => {
    trigger({ offset, limit })
  }, [])

  useEffect(() => {
    appDispatch(setIsFetching(notifications.isFetching))
    if (notifications.data) {
      appDispatch(setData(notifications.data.data))
      appDispatch(updateCount(notifications.data.count))
    }
  }, [notifications])

  useEffect(() => {
    if (totalUnread.data) {
      appDispatch(setUnreadCount(totalUnread.data))
    }
  }, [totalUnread])

  return {
    data,
    count,
    limit,
    offset,
    loaderRef,
    unreadCount,
  }
}
