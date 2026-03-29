'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import { io, type Socket } from 'socket.io-client';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IoAttachOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkDoneOutline,
  IoCloseOutline,
  IoImageOutline,
  IoRefreshOutline,
  IoSend,
} from 'react-icons/io5';
import {
  type ChatConversation,
  type ChatMessage,
  type ChatSendPayload,
  type ChatUserPreview,
  useGetChatConversationsQuery,
  useGetChatMessagesQuery,
  useMarkChatConversationSeenMutation,
  useResolveChatConversationMutation,
  useSendChatMessageMutation,
  useUploadChatImagesMutation,
} from '@/store/chatApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MAX_ATTACHMENTS = 5;

type MarketplaceRole = 'buyer' | 'seller';

interface MarketplaceChatPanelProps {
  role: MarketplaceRole;
  title: string;
  description: string;
  allowResolve?: boolean;
}

const normalizeApiError = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object'
  ) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
};

const resolveAssetUrl = (value?: string | null) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${getApiOrigin()}${normalized}`;
};

const formatClockTime = (value?: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const decodeConversationId = (value: string | null) => {
  if (!value) {
    return '';
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const toUserId = (value?: string | ChatUserPreview | null) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value._id || '';
};

const parseConversationParticipants = (conversationId?: string) => {
  if (!conversationId) {
    return [] as string[];
  }

  const [first, second] = conversationId.split('|');
  return [first, second].filter(Boolean);
};

const resolveCounterpartLabel = (conversation: ChatConversation, role: MarketplaceRole) => {
  const counterpart = conversation.counterpart;
  if (!counterpart) {
    return 'Conversation';
  }

  if (role === 'buyer') {
    return counterpart.storeName || counterpart.name || counterpart.email || 'Seller';
  }

  return counterpart.name || counterpart.email || counterpart.storeName || 'Buyer';
};

const resolveCounterpartSubline = (conversation: ChatConversation, role: MarketplaceRole) => {
  const counterpart = conversation.counterpart;
  if (!counterpart) {
    return role === 'buyer' ? 'Seller' : 'Buyer';
  }

  if (role === 'buyer') {
    return counterpart.email || counterpart.name || 'Seller';
  }

  return counterpart.email || counterpart.storeName || 'Buyer';
};

const resolveCounterpartInitial = (conversation: ChatConversation, role: MarketplaceRole) => {
  const counterpart = conversation.counterpart;
  const source =
    role === 'buyer'
      ? counterpart?.storeName || counterpart?.name || counterpart?.email
      : counterpart?.name || counterpart?.storeName || counterpart?.email;

  if (!source) {
    return role === 'buyer' ? 'S' : 'B';
  }

  return source.charAt(0).toUpperCase();
};

const resolveCurrentUserId = (conversation: ChatConversation | null) => {
  if (!conversation) {
    return '';
  }

  const counterpartId = conversation.counterpart?._id;
  const participants = parseConversationParticipants(conversation.conversationId);
  if (!counterpartId || participants.length !== 2) {
    return '';
  }

  return participants.find((participant) => participant !== counterpartId) || '';
};

const resolveMessagePreview = (conversation: ChatConversation) => {
  const text = conversation.lastMessage.message?.trim();
  if (text) {
    return text;
  }

  if ((conversation.lastMessage.imageUrls || []).length > 0) {
    return 'Sent image attachment';
  }

  return 'No message content';
};

const MarketplaceChatPanel = ({
  role,
  title,
  description,
  allowResolve = false,
}: MarketplaceChatPanelProps) => {
  const searchParams = useSearchParams();

  const initialReceiverId = searchParams.get('receiverId')?.trim() || '';
  const initialOrderId = searchParams.get('orderId')?.trim() || '';
  const initialProductId = searchParams.get('productId')?.trim() || '';
  const conversationFromQuery = decodeConversationId(searchParams.get('conversationId'));

  const [manualConversationId, setManualConversationId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('token');
  });
  const [storedRole, setStoredRole] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('role');
  });
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const markSeenInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncAuthFromStorage = () => {
      setAuthToken(localStorage.getItem('token'));
      setStoredRole(localStorage.getItem('role'));
    };

    window.addEventListener('storage', syncAuthFromStorage);

    return () => {
      window.removeEventListener('storage', syncAuthFromStorage);
    };
  }, []);

  const {
    data: conversationsResponse,
    isLoading: conversationsLoading,
    isFetching: conversationsFetching,
    isError: conversationsError,
    error: conversationsRequestError,
    refetch: refetchConversations,
  } = useGetChatConversationsQuery(
    {
      page: 1,
      limit: 40,
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 25000,
      skip: !authToken || storedRole !== role,
    }
  );

  const conversations = useMemo(
    () => conversationsResponse?.data?.conversations || [],
    [conversationsResponse?.data?.conversations]
  );

  const activeConversationId = useMemo(() => {
    if (manualConversationId) {
      return manualConversationId;
    }

    if (conversationFromQuery) {
      return conversationFromQuery;
    }

    return conversations[0]?.conversationId || null;
  }, [conversationFromQuery, conversations, manualConversationId]);

  useEffect(() => {
    selectedConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.conversationId === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const currentUserId = useMemo(
    () => resolveCurrentUserId(selectedConversation),
    [selectedConversation]
  );

  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    isFetching: messagesFetching,
    isError: messagesError,
    error: messagesRequestError,
    refetch: refetchMessages,
  } = useGetChatMessagesQuery(
    activeConversationId
      ? {
          conversationId: activeConversationId,
          page: 1,
          limit: 100,
        }
      : skipToken,
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const messages = useMemo(() => messagesResponse?.data?.messages || [], [messagesResponse?.data?.messages]);

  const [sendChatMessage, { isLoading: sendingMessage }] = useSendChatMessageMutation();
  const [uploadChatImages, { isLoading: uploadingImages }] = useUploadChatImagesMutation();
  const [markConversationSeen] = useMarkChatConversationSeenMutation();
  const [resolveConversation, { isLoading: resolvingConversation }] =
    useResolveChatConversationMutation();

  const conversationRefreshRef = useRef(refetchConversations);
  const messageRefreshRef = useRef(refetchMessages);

  useEffect(() => {
    conversationRefreshRef.current = refetchConversations;
  }, [refetchConversations]);

  useEffect(() => {
    messageRefreshRef.current = refetchMessages;
  }, [refetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (!activeConversationId || !currentUserId || messages.length === 0) {
      return;
    }

    const hasUnseenIncoming = messages.some(
      (message) => toUserId(message.senderId) !== currentUserId && message.status === 'sent'
    );

    if (!hasUnseenIncoming) {
      return;
    }

    if (markSeenInFlightRef.current === activeConversationId) {
      return;
    }

    markSeenInFlightRef.current = activeConversationId;

    void markConversationSeen({ conversationId: activeConversationId })
      .unwrap()
      .catch(() => {
        // Ignore periodic seen sync failures in background.
      })
      .finally(() => {
        markSeenInFlightRef.current = null;
      });
  }, [activeConversationId, currentUserId, markConversationSeen, messages]);

  useEffect(() => {
    if (!authToken || storedRole !== role) {
      return;
    }

    const socket = io(getApiOrigin(), {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${authToken}`,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('chat:message', (incoming: ChatMessage) => {
      void conversationRefreshRef.current();
      if (incoming?.conversationId && incoming.conversationId === selectedConversationIdRef.current) {
        void messageRefreshRef.current();
      }
    });

    socket.on('chat:seen', (payload: { conversationId?: string }) => {
      if (!payload?.conversationId) {
        return;
      }

      void conversationRefreshRef.current();
      if (payload.conversationId === selectedConversationIdRef.current) {
        void messageRefreshRef.current();
      }
    });

    socket.on('chat:resolved', (payload: { conversationId?: string }) => {
      if (!payload?.conversationId) {
        return;
      }

      void conversationRefreshRef.current();
      if (payload.conversationId === selectedConversationIdRef.current) {
        void messageRefreshRef.current();
      }
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [authToken, role, storedRole]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) {
      return;
    }

    socket.emit('chat:joinConversation', { conversationId: activeConversationId });

    return () => {
      socket.emit('chat:leaveConversation', { conversationId: activeConversationId });
    };
  }, [activeConversationId]);

  const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    setAttachments((previous) => {
      const merged = [...previous, ...files].slice(0, MAX_ATTACHMENTS);
      if (previous.length + files.length > MAX_ATTACHMENTS) {
        toast.error(`Only ${MAX_ATTACHMENTS} image attachments are allowed per message.`);
      }
      return merged;
    });

    event.target.value = '';
  };

  const removeAttachmentAt = (index: number) => {
    setAttachments((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage && attachments.length === 0) {
      return;
    }

    const payload: ChatSendPayload = {};

    if (activeConversationId) {
      payload.conversationId = activeConversationId;
    } else if (initialReceiverId) {
      payload.receiverId = initialReceiverId;
      if (initialOrderId) {
        payload.orderId = initialOrderId;
      }
      if (initialProductId) {
        payload.productId = initialProductId;
      }
    } else {
      toast.error('Select a conversation first.');
      return;
    }

    if (trimmedMessage) {
      payload.message = trimmedMessage;
    }

    try {
      if (attachments.length > 0) {
        const uploadResponse = await uploadChatImages(attachments).unwrap();
        payload.imageUrls = uploadResponse.data.imageUrls || [];
      }

      const sendResponse = await sendChatMessage(payload).unwrap();
      const createdMessage = sendResponse.data;

      setDraftMessage('');
      setAttachments([]);

      if (createdMessage?.conversationId) {
        setManualConversationId(createdMessage.conversationId);
      }

      void refetchConversations();
      if (activeConversationId) {
        void refetchMessages();
      }
    } catch (error) {
      toast.error(normalizeApiError(error, 'Unable to send message.'));
    }
  };

  const handleResolveConversation = async () => {
    if (!activeConversationId) {
      return;
    }

    try {
      await resolveConversation({ conversationId: activeConversationId }).unwrap();
      toast.success('Conversation marked as resolved.');
      void refetchConversations();
      if (activeConversationId) {
        void refetchMessages();
      }
    } catch (error) {
      toast.error(normalizeApiError(error, 'Unable to resolve conversation.'));
    }
  };

  const isBusy = sendingMessage || uploadingImages;
  const showRoleGate = !authToken || storedRole !== role;
  const canStartConversation = Boolean(initialReceiverId);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-light uppercase tracking-[0.28em] text-emerald-700">Marketplace Chat</p>
          <h1 className="text-3xl font-light tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm font-light text-zinc-600">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-light uppercase tracking-[0.16em] ${
              socketConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
              }`}
            />
            {socketConnected ? 'Realtime connected' : 'Realtime idle'}
          </span>

          <button
            type="button"
            onClick={() => {
              void refetchConversations();
              if (activeConversationId) {
                void refetchMessages();
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-light uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-700 hover:bg-emerald-100"
          >
            <IoRefreshOutline className="text-sm" />
            Refresh
          </button>
        </div>
      </div>

      {showRoleGate ? (
        <div className="rounded-[1.8rem] border border-zinc-200 bg-white p-8 text-center shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
          <IoChatbubbleEllipsesOutline className="mx-auto text-4xl text-zinc-300" />
          <h2 className="mt-3 text-xl font-light tracking-tight text-zinc-900">Authentication required</h2>
          <p className="mt-2 text-sm font-light text-zinc-500">
            Sign in as a {role} account to access marketplace conversations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-[1.8rem] border border-emerald-200/60 bg-[linear-gradient(160deg,#d9fdd3_0%,#f0f7f1_40%,#ffffff_100%)] p-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-[1.4rem] border border-zinc-200 bg-white p-3 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.4)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-light uppercase tracking-[0.18em] text-zinc-600">Conversations</h2>
              {conversationsFetching ? (
                <span className="text-[10px] font-light uppercase tracking-[0.14em] text-emerald-600">
                  Syncing...
                </span>
              ) : null}
            </div>

            {conversationsLoading ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-light text-zinc-500">
                Loading conversations...
              </div>
            ) : null}

            {conversationsError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-light text-rose-700">
                {normalizeApiError(conversationsRequestError, 'Unable to fetch conversations.')}
              </div>
            ) : null}

            {!conversationsLoading && !conversationsError && conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-center">
                <p className="text-sm font-light text-zinc-600">No conversations yet.</p>
                <p className="mt-2 text-xs font-light text-zinc-400">
                  Open chat from order context to start messaging.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isSelected = activeConversationId === conversation.conversationId;

                return (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() => setManualConversationId(conversation.conversationId)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-700/20'
                        : 'border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-light ${
                          isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {resolveCounterpartInitial(conversation, role)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm font-light ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {resolveCounterpartLabel(conversation, role)}
                          </p>

                          <p className={`text-[10px] font-light uppercase tracking-[0.14em] ${isSelected ? 'text-emerald-50' : 'text-zinc-400'}`}>
                            {formatClockTime(conversation.lastMessage.createdAt)}
                          </p>
                        </div>

                        <p className={`mt-1 truncate text-xs font-light ${isSelected ? 'text-emerald-50' : 'text-zinc-500'}`}>
                          {resolveCounterpartSubline(conversation, role)}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className={`line-clamp-1 text-xs font-light ${isSelected ? 'text-emerald-50' : 'text-zinc-600'}`}>
                            {resolveMessagePreview(conversation)}
                          </p>

                          {conversation.unreadCount > 0 ? (
                            <span
                              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-light ${
                                isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>

                        {conversation.conversationResolved ? (
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-light uppercase tracking-[0.14em] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Resolved
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="overflow-hidden rounded-[1.4rem] border border-zinc-200 bg-white shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)]">
            {!selectedConversation && !canStartConversation ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center bg-[#ece5dd] p-8 text-center">
                <IoChatbubbleEllipsesOutline className="text-4xl text-zinc-400" />
                <h2 className="mt-3 text-xl font-light tracking-tight text-zinc-900">Choose a conversation</h2>
                <p className="mt-2 max-w-md text-sm font-light text-zinc-600">
                  Select an existing conversation, or open chat from an order to start messaging.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[620px] flex-col">
                <header className="flex flex-wrap items-start justify-between gap-3 bg-[#075e54] px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-light text-emerald-700">
                      {selectedConversation
                        ? resolveCounterpartInitial(selectedConversation, role)
                        : role === 'buyer'
                          ? 'S'
                          : 'B'}
                    </span>

                    <div>
                      <p className="text-sm font-light tracking-wide">
                        {selectedConversation
                          ? resolveCounterpartLabel(selectedConversation, role)
                          : role === 'buyer'
                            ? 'New seller conversation'
                            : 'New buyer conversation'}
                      </p>
                      <p className="text-xs font-light text-emerald-100">
                        {selectedConversation
                          ? resolveCounterpartSubline(selectedConversation, role)
                          : 'Send your first message to start this chat.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedConversation?.orderRef?._id ? (
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-light uppercase tracking-[0.14em] text-white">
                        Order #{selectedConversation.orderRef._id.slice(-8)}
                      </span>
                    ) : initialOrderId ? (
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-light uppercase tracking-[0.14em] text-white">
                        Order #{initialOrderId.slice(-8)}
                      </span>
                    ) : null}

                    {selectedConversation?.productRef?._id ? (
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-light uppercase tracking-[0.14em] text-white">
                        Product: {selectedConversation.productRef.productName || 'Item'}
                      </span>
                    ) : null}

                    {selectedConversation ? (
                      selectedConversation.conversationResolved ? (
                        <span className="rounded-full bg-emerald-200 px-2 py-1 text-[10px] font-light uppercase tracking-[0.14em] text-emerald-800">
                          Resolved
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-200 px-2 py-1 text-[10px] font-light uppercase tracking-[0.14em] text-amber-900">
                          Active
                        </span>
                      )
                    ) : (
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-light uppercase tracking-[0.14em] text-white">
                        New chat
                      </span>
                    )}

                    {allowResolve && selectedConversation && !selectedConversation.conversationResolved ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleResolveConversation();
                        }}
                        disabled={resolvingConversation}
                        className="rounded-xl border border-white/40 bg-white/10 px-3 py-2 text-[10px] font-light uppercase tracking-[0.16em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolvingConversation ? 'Resolving...' : 'Resolve'}
                      </button>
                    ) : null}
                  </div>
                </header>

                <div className="flex-1 bg-[radial-gradient(circle_at_top,_#f6f6f6_0%,_#ece5dd_78%)] p-3">
                  {selectedConversation ? (
                    <>
                      {messagesLoading ? (
                        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/95 p-4 text-sm font-light text-zinc-600">
                          Loading messages...
                        </div>
                      ) : null}

                      {messagesError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-light text-rose-700">
                          {normalizeApiError(messagesRequestError, 'Unable to fetch messages.')}
                        </div>
                      ) : null}

                      {!messagesLoading && !messagesError ? (
                        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                          {messages.length === 0 ? (
                            <div className="mx-auto max-w-md rounded-xl border border-dashed border-zinc-200 bg-white/90 p-4 text-center text-sm font-light text-zinc-600">
                              No messages yet. Send the first message to begin.
                            </div>
                          ) : null}

                          {messages.map((message) => {
                            const isOwn = toUserId(message.senderId) === currentUserId;
                            const senderName =
                              typeof message.senderId === 'string'
                                ? isOwn
                                  ? 'You'
                                  : 'Partner'
                                : message.senderId.storeName ||
                                  message.senderId.name ||
                                  message.senderId.email ||
                                  'User';

                            return (
                              <article
                                key={message._id}
                                className={`max-w-[84%] rounded-2xl px-3 py-2 shadow-sm ${
                                  isOwn
                                    ? 'ml-auto rounded-br-md bg-[#dcf8c6] text-zinc-800'
                                    : 'mr-auto rounded-bl-md border border-zinc-200 bg-white text-zinc-800'
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-light uppercase tracking-[0.16em] ${
                                    isOwn ? 'text-emerald-700' : 'text-zinc-400'
                                  }`}
                                >
                                  {isOwn ? 'You' : senderName}
                                </p>

                                {message.message ? (
                                  <p className="mt-1 whitespace-pre-wrap text-sm font-light leading-relaxed">
                                    {message.message}
                                  </p>
                                ) : null}

                                {(message.imageUrls || []).length > 0 ? (
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    {(message.imageUrls || []).map((imageUrl, index) => (
                                      <img
                                        key={`${message._id}-${index}`}
                                        src={resolveAssetUrl(imageUrl)}
                                        alt="Chat attachment"
                                        className="h-24 w-full rounded-xl border border-black/10 object-cover"
                                      />
                                    ))}
                                  </div>
                                ) : null}

                                <div className="mt-2 flex items-center justify-end gap-2 text-[10px] font-light uppercase tracking-[0.14em]">
                                  <span className={isOwn ? 'text-emerald-700' : 'text-zinc-400'}>
                                    {formatClockTime(message.createdAt)}
                                  </span>
                                  {isOwn ? (
                                    <span
                                      className={`inline-flex items-center gap-1 ${
                                        message.status === 'seen' ? 'text-emerald-700' : 'text-zinc-400'
                                      }`}
                                    >
                                      <IoCheckmarkDoneOutline className="text-xs" />
                                      {message.status}
                                    </span>
                                  ) : null}
                                </div>
                              </article>
                            );
                          })}

                          {messagesFetching ? (
                            <p className="text-center text-[10px] font-light uppercase tracking-[0.14em] text-zinc-500">
                              Syncing messages...
                            </p>
                          ) : null}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center">
                      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white/95 p-5 text-center shadow-sm">
                        <IoChatbubbleEllipsesOutline className="mx-auto text-4xl text-emerald-500" />
                        <h3 className="mt-3 text-lg font-light tracking-tight text-zinc-900">
                          Start a new conversation
                        </h3>
                        <p className="mt-2 text-sm font-light text-zinc-600">
                          Send your first message now. This chat will appear in the conversation list instantly.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="space-y-3 border-t border-zinc-200 bg-[#f0f2f5] p-3">
                  {attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-light text-zinc-600"
                        >
                          <IoImageOutline className="text-sm text-emerald-600" />
                          <span className="max-w-[140px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachmentAt(index)}
                            className="rounded-full p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
                            aria-label="Remove attachment"
                          >
                            <IoCloseOutline className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-emerald-600 hover:text-emerald-700"
                      aria-label="Attach image"
                    >
                      <IoAttachOutline className="text-lg" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      multiple
                      onChange={handleAttachmentSelection}
                      className="hidden"
                    />

                    <textarea
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder="Type a message"
                      className="min-h-11 flex-1 resize-none rounded-3xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition focus:border-emerald-500"
                    />

                    <button
                      type="submit"
                      disabled={isBusy || (!draftMessage.trim() && attachments.length === 0)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      aria-label="Send message"
                    >
                      {isBusy ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <IoSend className="text-lg" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

export default MarketplaceChatPanel;
