export interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  groupId: string;
  group: {
    id: string;
    name: string;
  };
  likes: string[]; // Array of user IDs who liked the post
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  postId: string;
  parentCommentId?: string; // For nested comments/replies
  likes: string[];
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
}

export interface CreatePostData {
  content: string;
  groupId: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentCommentId?: string;
}

export interface PostResponse {
  message: string;
  post: Post;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
}