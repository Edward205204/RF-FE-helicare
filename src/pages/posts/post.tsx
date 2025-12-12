import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Label } from "@/components/ui";
import path from "@/constants/path";
import {
  createPost,
  updatePost,
  getPostById,
  type CreatePostData,
  type Post,
} from "@/apis/post.api";
import { uploadImage } from "@/apis/media.api";
import { X, Upload, Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";

interface FormData {
  title: string;
  content: string;
  tags: string[];
  images: File[];
  imageUrls: string[]; // URLs từ server sau khi upload
  visibility: "STAFF_ONLY" | "STAFF_AND_FAMILY_OF_RESIDENTS" | "PUBLIC";
}

const StaffCreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(postId);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    tags: [],
    images: [],
    imageUrls: [],
    visibility: "PUBLIC",
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load post data nếu đang ở chế độ edit
  useEffect(() => {
    const loadPostData = async () => {
      if (!isEditMode || !postId) {
        // Nếu có post từ location.state (khi navigate từ newsfeed)
        const postFromState = (location.state as { post?: Post })?.post;
        if (postFromState) {
          setFormData({
            title: postFromState.title,
            content: postFromState.content,
            tags: postFromState.tags || [],
            images: [],
            imageUrls: postFromState.imageUrls || [],
            visibility: postFromState.visibility,
          });
        }
        return;
      }

      setLoadingPost(true);
      try {
        const post = await getPostById(postId);
        setFormData({
          title: post.title,
          content: post.content,
          tags: post.tags || [],
          images: [],
          imageUrls: post.imageUrls || [],
          visibility: post.visibility,
        });
      } catch (error) {
        console.error("Error loading post:", error);
        alert("Failed to load post. Please try again.");
        navigate(path.newsFeed);
      } finally {
        setLoadingPost(false);
      }
    };

    loadPostData();
  }, [isEditMode, postId, navigate, location.state]);

  // Handle image upload - upload thực sự lên server
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setUploadingImages(true);

    try {
      // Upload ảnh lên server
      const uploadResults = await uploadImage(newFiles);
      const uploadedUrls = uploadResults.map((result) => result.url);

      console.log("Uploaded image URLs:", uploadedUrls);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newFiles],
        imageUrls: [...prev.imageUrls, ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImages(false);
      // Reset input để có thể chọn lại file cùng tên
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      const newImageUrls = [...prev.imageUrls];
      newImages.splice(index, 1);
      newImageUrls.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        imageUrls: newImageUrls,
      };
    });
  };

  // Add tag
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;

    if (!formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
    }
    setTagInput("");
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      alert("Please enter the post title.");
      return;
    }

    if (!formData.content.trim()) {
      alert("Please enter the post content.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreatePostData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        imageUrls:
          formData.imageUrls.length > 0 ? formData.imageUrls : undefined,
        visibility: formData.visibility,
        // Không gửi residentIds nữa
      };

      if (isEditMode && postId) {
        await updatePost({ id: postId, ...payload });
      } else {
        await createPost(payload);
      }

      navigate(path.newsFeed);
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5985d8]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto p-6">
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Post" : "Create New Post"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Visibility
            </Label>
            <Select
              value={formData.visibility}
              onValueChange={(
                value: "STAFF_ONLY" | "STAFF_AND_FAMILY_OF_RESIDENTS" | "PUBLIC"
              ) => {
                setFormData((prev) => ({ ...prev, visibility: value }));
              }}
            >
              <SelectTrigger className="border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-gray-200 bg-white">
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="STAFF_AND_FAMILY_OF_RESIDENTS">
                  Staff and Resident Family
                </SelectItem>
                <SelectItem value="STAFF_ONLY">Staff Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Tags (Room / Activity / Shift)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag (e.g., Morning Yoga)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 border-gray-200"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                className="border-gray-200"
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border border-gray-200"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter post title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="border-gray-200"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter detailed content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={6}
              className="border-gray-200 resize-none"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Images</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                {uploadingImages ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
                <div className="text-center">
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer text-sm text-[#5985d8] hover:text-[#4a75c7] font-medium"
                  >
                    {uploadingImages ? "Uploading..." : "Select Images"}
                  </Label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF max 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Image Previews - hiển thị từ URLs đã upload */}
            {formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {formData.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-4 border-t border-gray-100 pt-6">
          <Button
            variant="outline"
            onClick={() => navigate(path.newsFeed)}
            className="border-gray-200"
            disabled={loading || uploadingImages}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || uploadingImages}
            className="bg-[#5985d8] hover:bg-[#4a75c7] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Post"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StaffCreatePost;
