import { apiSlice, type UserRole } from './apiSlice';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ChatPagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ChatUserPreview {
  _id?: string;
  role?: UserRole;
  name?: string;
  storeName?: string;
  email?: string;
  storeLogo?: string;
}

export interface ChatOrderRef {
  _id?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
}

export interface ChatProductRef {
  _id?: string;
  productName?: string;
  skuCode?: string;
  productImages?: string[];
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string | ChatUserPreview;
  receiverId: string | ChatUserPreview;
  orderId?: string | ChatOrderRef | null;
  productId?: string | ChatProductRef | null;
  message?: string;
  imageUrls?: string[];
  status: 'sent' | 'seen';
  seenAt?: string | null;
  conversationResolved?: boolean;
  resolvedAt?: string | null;
  resolvedBySeller?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatConversation {
  conversationId: string;
  unreadCount: number;
  totalMessages: number;
  conversationResolved?: boolean;
  resolvedAt?: string | null;
  resolvedBySeller?: string | null;
  counterpart?: ChatUserPreview;
  lastMessage: {
    _id: string;
    senderId: string;
    receiverId: string;
    message?: string;
    imageUrls?: string[];
    status: 'sent' | 'seen';
    createdAt: string;
    orderId?: string | null;
    productId?: string | null;
  };
  orderRef?: ChatOrderRef;
  productRef?: ChatProductRef;
}

export interface ChatConversationsData {
  conversations: ChatConversation[];
  pagination: ChatPagination;
}

export interface ChatMessagesData {
  messages: ChatMessage[];
  pagination: ChatPagination;
}

export interface ChatSeenData {
  conversationId: string;
  seenCount: number;
  seenAt: string;
}

export interface ChatResolveData {
  conversationId: string;
  resolved: boolean;
  resolvedAt: string;
  resolvedBySeller?: string;
}

export interface ChatConversationsQuery {
  page?: number;
  limit?: number;
  resolved?: boolean;
}

export interface ChatMessagesQuery {
  conversationId: string;
  page?: number;
  limit?: number;
}

export interface ChatSendPayload {
  receiverId?: string;
  conversationId?: string;
  orderId?: string;
  productId?: string;
  message?: string;
  imageUrls?: string[];
}

const toConversationParams = (query?: ChatConversationsQuery | void) => {
  const params: Record<string, string> = {};

  if (!query) {
    return params;
  }

  if (typeof query.page === 'number') {
    params.page = String(query.page);
  }

  if (typeof query.limit === 'number') {
    params.limit = String(query.limit);
  }

  if (typeof query.resolved === 'boolean') {
    params.resolved = String(query.resolved);
  }

  return params;
};

const encodeConversationId = (conversationId: string) => encodeURIComponent(conversationId);

const buildImagesFormData = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });
  return formData;
};

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatConversations: builder.query<ApiResponse<ChatConversationsData>, ChatConversationsQuery | void>({
      query: (query) => ({
        url: '/chat/conversations',
        params: toConversationParams(query),
      }),
      providesTags: (result) => {
        if (!result?.data?.conversations) {
          return [{ type: 'ChatConversation' as const, id: 'LIST' }];
        }

        return [
          ...result.data.conversations.map((conversation) => ({
            type: 'ChatConversation' as const,
            id: conversation.conversationId,
          })),
          { type: 'ChatConversation' as const, id: 'LIST' },
        ];
      },
    }),

    getChatMessages: builder.query<ApiResponse<ChatMessagesData>, ChatMessagesQuery>({
      query: ({ conversationId, page = 1, limit = 50 }) => ({
        url: `/chat/conversations/${encodeConversationId(conversationId)}/messages`,
        params: {
          page: String(page),
          limit: String(limit),
        },
      }),
      providesTags: (result, _error, arg) => {
        if (!result?.data?.messages) {
          return [
            { type: 'ChatMessage' as const, id: `LIST-${arg.conversationId}` },
            { type: 'ChatConversation' as const, id: arg.conversationId },
          ];
        }

        return [
          ...result.data.messages.map((message) => ({ type: 'ChatMessage' as const, id: message._id })),
          { type: 'ChatMessage' as const, id: `LIST-${arg.conversationId}` },
          { type: 'ChatConversation' as const, id: arg.conversationId },
        ];
      },
    }),

    sendChatMessage: builder.mutation<ApiResponse<ChatMessage>, ChatSendPayload>({
      query: (body) => ({
        url: '/chat/messages',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatConversation', id: 'LIST' },
        ...(arg.conversationId
          ? [
              { type: 'ChatConversation' as const, id: arg.conversationId },
              { type: 'ChatMessage' as const, id: `LIST-${arg.conversationId}` },
            ]
          : []),
      ],
    }),

    markChatConversationSeen: builder.mutation<ApiResponse<ChatSeenData>, { conversationId: string }>({
      query: ({ conversationId }) => ({
        url: `/chat/conversations/${encodeConversationId(conversationId)}/seen`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatConversation', id: 'LIST' },
        { type: 'ChatConversation', id: arg.conversationId },
        { type: 'ChatMessage', id: `LIST-${arg.conversationId}` },
      ],
    }),

    resolveChatConversation: builder.mutation<ApiResponse<ChatResolveData>, { conversationId: string }>({
      query: ({ conversationId }) => ({
        url: `/chat/conversations/${encodeConversationId(conversationId)}/resolve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatConversation', id: 'LIST' },
        { type: 'ChatConversation', id: arg.conversationId },
        { type: 'ChatMessage', id: `LIST-${arg.conversationId}` },
      ],
    }),

    uploadChatImages: builder.mutation<ApiResponse<{ imageUrls: string[] }>, File[]>({
      query: (files) => ({
        url: '/chat/upload',
        method: 'POST',
        body: buildImagesFormData(files),
      }),
    }),
  }),
});

export const {
  useGetChatConversationsQuery,
  useGetChatMessagesQuery,
  useSendChatMessageMutation,
  useMarkChatConversationSeenMutation,
  useResolveChatConversationMutation,
  useUploadChatImagesMutation,
} = chatApi;
