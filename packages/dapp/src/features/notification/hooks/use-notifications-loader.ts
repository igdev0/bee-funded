import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "@core/store"
import { useLazyGetNotificationsQuery } from "@features/notification/services/notification-api.ts"
import {
  loadData,
  setIsFetching,
  updateCount,
} from "@features/notification/store/notification.ts"

export default function useNotificationsLoader() {
  const [trigger, notifications] = useLazyGetNotificationsQuery()
  const appDispatch = useAppDispatch()
  const loaderRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const offset = useSelector(
    (state: RootState) => state.notificationSlice.offset,
  )
  const limit = useSelector((state: RootState) => state.notificationSlice.limit)

  const onShouldLoad = useCallback(() => {
    if (!notifications.isFetching) {
      trigger({ offset, limit })
    }
  }, [offset, limit, notifications])

  useEffect(() => {
    onShouldLoad()
  }, [isIntersecting])

  useLayoutEffect(() => {
    if (!loaderRef.current) {
      return
    }
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 1.0,
      },
    )
    intersectionObserver.observe(loaderRef.current)

    return () => {
      intersectionObserver.disconnect()
      if (loaderRef.current) {
        intersectionObserver.unobserve(loaderRef.current)
      }
    }
  }, [])

  useEffect(() => {
    appDispatch(setIsFetching(notifications.isFetching))
    if (notifications.data && !notifications.isFetching) {
      appDispatch(loadData(notifications.data.data))
      appDispatch(updateCount(notifications.data.count))
    }
  }, [notifications])
  return [loaderRef]
}
