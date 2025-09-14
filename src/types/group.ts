export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  coverImage?: string;
  rules?: string;
  location?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

export interface CreateGroupData {
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  location?: string;
  tags: string[];
  rules?: string;
}

export interface GroupResponse {
  message: string;
  group: Group;
}

export interface GroupListResponse {
  groups: Group[];
  total: number;
}