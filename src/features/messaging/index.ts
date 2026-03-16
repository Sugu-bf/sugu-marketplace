// ─── API ─────────────────────────────────────────────────
export type { RecommendedProduct } from "./api";

// ─── Hooks & Store ───────────────────────────────────────
export {
  useConversations,
  useConversation,
  useMessages,
  usePresence,
  useRecommendedProducts,
  useSendMessage,
  useSendProductCard,
  useMarkAsRead,
  useStartConversation,
  useReportMessage,
  useMessagingStore,
  messagingKeys,
} from "./hooks";

// ─── Components ──────────────────────────────────────────
export { MessagingPage } from "./components/MessagingPage";
export { ConversationList } from "./components/ConversationList";
export { ConversationCard } from "./components/ConversationCard";
export { ChatRoom } from "./components/ChatRoom";
export { MessageBubble } from "./components/MessageBubble";
export { ProductCardBubble } from "./components/ProductCardBubble";
export { SystemEventBubble } from "./components/SystemEventBubble";
export { Composer } from "./components/Composer";
export { TypingIndicator } from "./components/TypingIndicator";
export { ReadReceipt } from "./components/ReadReceipt";
export { DateSeparator } from "./components/DateSeparator";
export { ContactPanel } from "./components/ContactPanel";
export { ProductListItem } from "./components/ProductListItem";
export { EmptyState } from "./components/EmptyState";
export { ConversationListSkeleton, ChatRoomSkeleton } from "./components/ChatSkeleton";
