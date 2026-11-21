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

## Super admin analytics

The **Super Admin Overview** is available at `/superAdminDashboard` and appears in the admin sidebar for super admin profiles. It summarizes user roles, standalone questions, quizzes and their embedded questions, PDF resources, recent content, and uploads attributed to each admin.

To grant access, update the intended document in Firestore at `users/<uid>` and set its `role` to `superadmin` (the legacy-compatible value `super_admin` is also recognized). Super admin accounts are not offered in public sign-up. The page checks this profile before loading analytics.

### Storage reporting limitations

- Cloudinary usage is the sum of byte sizes recorded by this app for image-library uploads, profile photos, question and quiz images, and PDFs. Newly uploaded media records its Cloudinary-reported size. Older media without saved size metadata is counted as untracked and excluded from the total.
- The browser does not have access to Cloudinary account plan capacity or remaining quota. Exact account-wide usage requires a trusted server-side integration with Cloudinary's authenticated Admin API; never expose its API secret in `VITE_*` variables or browser code.
- The current app has no Firebase Storage upload flow. Firebase Storage bucket usage, remaining quota, and Firestore billed storage are not available through the Firebase web SDK; check Firebase Console or add a trusted server-side monitoring integration.
- Analytics require read access to the `users`, `questions`, `quizzes`, `saved_images`, and `pdfs` collections. The page-level role check only controls the UI; update deployed Firestore Security Rules to authorize these collection-wide analytics reads for super admins and preserve existing restrictions for other users. Do not rely on client-side checks as a data security boundary.
