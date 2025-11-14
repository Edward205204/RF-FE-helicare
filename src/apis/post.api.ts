import request from "@/utils/request";

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrls?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  likes: number;
  comments: Comment[];
  residentIds: string[];
  visibility: "STAFF_ONLY" | "STAFF_AND_FAMILY_OF_RESIDENTS" | "PUBLIC";
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  isLiked?: boolean; // Trạng thái user đã like post này chưa
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  tags?: string[];
  imageUrls?: string[];
  residentIds?: string[]; // Optional - không bắt buộc nữa
  visibility?: "STAFF_ONLY" | "STAFF_AND_FAMILY_OF_RESIDENTS" | "PUBLIC";
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: string;
}

export interface PostListResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PostListParams {
  page?: number;
  limit?: number;
  filter?: "Day" | "Week" | "Month" | "All";
  search?: string;
  residentIds?: string[];
}

// Lấy danh sách posts với pagination
export const getPosts = async (
  params?: PostListParams
): Promise<PostListResponse> => {
  const response = await request.get("/api/posts", { params });
  // Backend trả về { message, data: { data: [...], total, ... } }
  return response.data.data;
};

// Lấy post theo ID
export const getPostById = async (postId: string): Promise<Post> => {
  const response = await request.get(`/api/posts/${postId}`);
  // Backend trả về { message, data: {...} }
  return response.data.data;
};

// Tạo post mới
export const createPost = async (data: CreatePostData): Promise<Post> => {
  const response = await request.post("/api/posts", data);
  // Backend trả về { message, data: {...} }
  return response.data.data;
};

// Cập nhật post
export const updatePost = async (data: UpdatePostData): Promise<Post> => {
  const { id, ...updateData } = data;
  const response = await request.put(`/api/posts/${id}`, updateData);
  // Backend trả về { message, data: {...} }
  return response.data.data;
};

// Xóa post
export const deletePost = async (postId: string): Promise<void> => {
  await request.delete(`/api/posts/${postId}`);
};

// Like/Unlike post
export const toggleLikePost = async (
  postId: string
): Promise<{ liked: boolean; likes: number }> => {
  const response = await request.post(`/api/posts/${postId}/like`);
  // Backend trả về { message, data: {...} }
  return response.data.data;
};

// Thêm comment
export const addComment = async (
  postId: string,
  content: string
): Promise<Comment> => {
  const response = await request.post(`/api/posts/${postId}/comments`, {
    content,
  });
  // Backend trả về { message, data: {...} }
  return response.data.data;
};

// Xóa comment
export const deleteComment = async (
  postId: string,
  commentId: string
): Promise<void> => {
  await request.delete(`/api/posts/${postId}/comments/${commentId}`);
};

// Báo cáo post
export const reportPost = async (
  postId: string,
  reason?: string
): Promise<void> => {
  await request.post(`/api/posts/${postId}/report`, { reason });
};
