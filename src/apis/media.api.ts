import request from "@/utils/request";

export interface UploadImageResponse {
  url: string;
  type: string;
}

// Upload image(s)
export const uploadImage = async (
  files: File[]
): Promise<UploadImageResponse[]> => {
  const formData = new FormData();

  // Backend expect field name is "image" and can accept multiple files
  files.forEach((file) => {
    formData.append("image", file);
  });

  // Không set Content-Type header, axios sẽ tự động set với boundary cho FormData
  const response = await request.post("/api/media/upload-image", formData);

  // Backend trả về { message, data: [{ url, type }, ...] }
  return response.data.data;
};
