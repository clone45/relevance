export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  conversationId: string;
  readBy: string[]; // Array of user IDs who have read this message
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  };
  lastActivity: Date;
  unreadCount: number; // Unread count for the current user
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageData {
  content: string;
  conversationId?: string;
  recipientId?: string; // For starting new conversations
}

export interface MessageResponse {
  message: string;
  data: Message;
}

export interface ConversationResponse {
  message: string;
  conversation: Conversation;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}