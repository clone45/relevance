export interface UnifiedGroupPost {
  id: string;
  type: 'group';
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  group: {
    id: string;
    name: string;
    description: string;
  };
  likes: string[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface UnifiedPersonalPost {
  id: string;
  type: 'personal';
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
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
  isEdited: boolean;
}

export type UnifiedPost = UnifiedGroupPost | UnifiedPersonalPost;

export interface UnifiedFeedResponse {
  posts: UnifiedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}