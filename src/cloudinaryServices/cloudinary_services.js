const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

export const uploadToCloudinary = async (file, resourceType = "auto") => {
  if (!CLOUDINARY_URL || !UPLOAD_PRESET) {
    throw new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_URL and VITE_UPLOAD_PRESET.");
  }

  if (!(file instanceof File)) {
    throw new Error("Choose an image file to upload.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const endpoint = CLOUDINARY_URL.replace(/\/+$/, "").replace(/\/image\/upload$/, `/${resourceType}/upload`);
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Cloudinary upload failed (${response.status}).`);
  }

  if (!data.secure_url) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return data.secure_url;
};
