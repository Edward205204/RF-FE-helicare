import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useNavigate, useLocation } from "react-router-dom";
import ResidentSelector from "@/components/shared/resident-selector";
import path from "@/constants/path";
import {
  getPosts,
  toggleLikePost,
  addComment,
  deletePost,
  reportPost,
  type Post,
  type Comment,
  type PostListParams,
} from "@/apis/post.api";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Send,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NewsFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  // Đảm bảo posts luôn là array
  const safePosts = Array.isArray(posts) ? posts : [];
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"Day" | "Week" | "Month" | "All">("All");
  const [search, setSearch] = useState("");
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [loadingComments, setLoadingComments] = useState<Set<string>>(
    new Set()
  );
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const limit = 10;

  // Fetch posts từ API
  const fetchPosts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const params: PostListParams = {
          page: pageNum,
          limit,
          filter: filter !== "All" ? filter : undefined,
          search: search.trim() || undefined,
          residentIds:
            selectedResidentIds.length > 0 ? selectedResidentIds : undefined,
        };

        const response = await getPosts(params);

        // Đảm bảo response.data là array
        const postsData = Array.isArray(response.data) ? response.data : [];

        // Set likedPosts từ isLiked trong response
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          postsData.forEach((post) => {
            if (post.isLiked) {
              newSet.add(post.id);
            } else {
              newSet.delete(post.id);
            }
          });
          return newSet;
        });

        if (reset) {
          setPosts(postsData);
        } else {
          setPosts((prev) => [...prev, ...postsData]);
        }

        setHasMore(response.hasMore ?? false);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading, filter, search, selectedResidentIds]
  );

  // Initial load và khi filter/search thay đổi
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [filter, search, selectedResidentIds]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, fetchPosts]);

  // Handle like
  const handleLike = async (postId: string) => {
    try {
      const response = await toggleLikePost(postId);
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (response.liked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes: response.likes } : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Handle comment
  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setLoadingComments((prev) => new Set(prev).add(postId));
    try {
      const newComment = await addComment(postId, commentText);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, newComment] }
            : post
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoadingComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Handle delete
  const handleDelete = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };

  // Handle report
  const handleReport = async (postId: string) => {
    try {
      await reportPost(postId);
      alert("Đã báo cáo bài viết thành công.");
    } catch (error) {
      console.error("Error reporting post:", error);
      alert("Không thể báo cáo bài viết. Vui lòng thử lại.");
    }
  };

  // Handle edit
  const handleEdit = (post: Post) => {
    navigate(`${path.createPost}/${post.id}`, { state: { post } });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-7xl mx-auto p-6">
      <div className="flex gap-6 h-full">
        {/* Sidebar Filters */}
        <aside className="flex-shrink-0 w-72 space-y-4">
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Thời gian
                </label>
                <Select
                  value={filter}
                  onValueChange={(value: "Day" | "Week" | "Month" | "All") =>
                    setFilter(value)
                  }
                >
                  <SelectTrigger className="w-full border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white">
                    <SelectItem value="All">Tất cả</SelectItem>
                    <SelectItem value="Day">Hôm nay</SelectItem>
                    <SelectItem value="Week">Tuần này</SelectItem>
                    <SelectItem value="Month">Tháng này</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tìm kiếm
                </label>
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              {/* Resident Filter */}
              <div>
                <ResidentSelector
                  selectedResidentIds={selectedResidentIds}
                  onChange={(ids) => setSelectedResidentIds(ids)}
                  initialSelectedResidents={[]}
                />
              </div>

              {/* Create Post Button */}
              <Button
                className="w-full bg-[#5985d8] hover:bg-[#4a75c7] text-white"
                onClick={() => navigate(path.createPost)}
              >
                Tạo bài viết mới
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {safePosts.length === 0 && !loading && (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">Chưa có bài viết nào.</p>
                </CardContent>
              </Card>
            )}

            {safePosts.map((post) => (
              <Card
                key={post.id}
                className="border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="border border-gray-200">
                        <AvatarImage
                          src={post.authorAvatar}
                          alt={post.authorName || "User"}
                        />
                        <AvatarFallback>
                          {(post.authorName || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {post.authorName || "Staff"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-4">
                        {post.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-gray-100 text-gray-700 border-gray-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-2"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-gray-200"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(post)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(post.id)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReport(post.id)}
                          className="cursor-pointer"
                        >
                          <Flag className="mr-2 h-4 w-4" />
                          Báo cáo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardTitle className="text-lg font-semibold text-gray-900 mt-3">
                    {post.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Images */}
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {post.imageUrls.map((imageUrl, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={imageUrl}
                            alt={`${post.title} - ${idx + 1}`}
                            className="w-full rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: "500px", minHeight: "200px" }}
                            loading="lazy"
                            onError={(e) => {
                              // Log lỗi để debug
                              console.error("Failed to load image:", imageUrl);
                              // Fallback nếu ảnh không load được
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/400x300?text=Image+Not+Found";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-gray-700 hover:text-red-600"
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          likedPosts.has(post.id)
                            ? "fill-red-600 text-red-600"
                            : "text-gray-500"
                        }`}
                      />
                      <span className="text-sm">
                        {post.likes > 0 ? post.likes : ""} Thích
                      </span>
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments.length} Bình luận</span>
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      {post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-3"
                        >
                          <Avatar className="h-6 w-6 border border-gray-200">
                            <AvatarImage src={comment.authorAvatar} />
                            <AvatarFallback>
                              {(comment.authorName || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <p className="text-xs font-semibold text-gray-900 mb-1">
                                {comment.authorName}
                              </p>
                              <p className="text-sm text-gray-700">
                                {comment.content}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Input
                      placeholder="Viết bình luận..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleComment(post.id);
                        }
                      }}
                      className="flex-1 border-gray-200"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      disabled={
                        !commentInputs[post.id]?.trim() ||
                        loadingComments.has(post.id)
                      }
                      className="bg-[#5985d8] hover:bg-[#4a75c7]"
                    >
                      {loadingComments.has(post.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#5985d8]" />
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-4" />

            {/* End of list */}
            {!hasMore && safePosts.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Đã hiển thị tất cả bài viết
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewsFeed;
