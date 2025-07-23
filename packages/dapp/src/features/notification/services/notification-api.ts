import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { RootState } from "@core/store"
import {
  GetNotificationsArgs,
  NotificationResponse,
} from "@features/notification/types"

const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_API_URL,
    prepareHeaders(headers, { getState }) {
      const token = (getState() as RootState).authSlice.accessToken
      if (token) {
        headers.set("authorization", `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ["Notification"],

  endpoints: builder => ({
    getNotifications: builder.query<NotificationResponse, GetNotificationsArgs>(
      {
        query: args => `notification?offset=${args.offset}&limit=${args.limit}`,
        providesTags: ["Notification"],
      },
    ),
    markAsRead: builder.mutation<void, string>({
      query: id => ({
        url: `notification/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    getTotalUnread: builder.query<number, void>({
      query: () => `notification/count-unread`,
    }),
  }),
})

export const {
  useMarkAsReadMutation,
  useLazyGetNotificationsQuery,
  useGetTotalUnreadQuery,
  util: { updateQueryData },
} = notificationApi

export default notificationApi
