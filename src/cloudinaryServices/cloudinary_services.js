const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL//"https://api.cloudinary.com/v1_1/dfjudeatw/image/upload";
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET//"dp_url"; // Replace with your Cloudinary preset name

export const uploadToCloudinary = async (file, resourceType = "auto") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("resource_type", resourceType); // Allow all file types

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary Upload Failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // URL of uploaded file
  } catch (error) {
    console.error("Upload Error:", error);
    return null;
  }
};
