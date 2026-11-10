# SKYi(Success Knows You)

![Image](https://github.com/user-attachments/assets/628e5914-ee23-442f-a111-49aacdf09ec1)

## Personal image library

Signed-in users can open **Image Library** from the user sidebar to save screenshots and images. Add an image by selecting it, dragging it onto the page, or pasting it from the clipboard. Each saved item has a required heading, optional description, folder, subject, tags, and an automatically recorded save date. Images are uploaded to Cloudinary and their per-user metadata is stored in the `saved_images` Firestore collection.

The existing Cloudinary environment variables must be configured:

- `VITE_CLOUDINARY_URL` — the Cloudinary upload endpoint, such as `https://api.cloudinary.com/v1_1/<cloud-name>/image/upload`.
- `VITE_UPLOAD_PRESET` — the name of an unsigned upload preset enabled for images.

### Firestore access

Merge a rule like the following into the project's Firestore rules so a signed-in user can only create and read their own image metadata:

```text
match /saved_images/{imageId} {
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;
  allow read: if request.auth != null
    && resource.data.userId == request.auth.uid;
}
```

### Sharing from WhatsApp

The app declares an image share target. On a supported Android browser (for example, Chrome), install SKYi as a PWA; it will then appear in the system share sheet for images shared from WhatsApp. Shared images open in the library for metadata and saving. Clipboard paste and file upload remain available in regular desktop/mobile browser use. The share target requires HTTPS outside local development.
