export interface Friendship {
  id: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  friendshipId: string;
  friendedAt: Date;
}

export interface PersonalPost {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  targetUserId: string;
  targetUser: {
    id: string;
    name: string;
    email: string;
  };
  likes: string[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
}

export interface FriendRequest {
  id: string;
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
  };
  type: 'incoming' | 'outgoing';
  createdAt: Date;
}

export interface CreatePersonalPostData {
  content: string;
  targetUserId: string;
}

export interface FriendshipResponse {
  message: string;
  friendship: Friendship;
}

export interface FriendsListResponse {
  friends: Friend[];
  total: number;
}

export interface FriendRequestsResponse {
  requests: FriendRequest[];
  total: number;
}