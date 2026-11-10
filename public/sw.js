const SHARE_DB = "skyi-image-shares";
const SHARE_STORE = "inbound";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "POST" || requestUrl.pathname !== "/share-target") return;

  event.respondWith((async () => {
    const formData = await event.request.formData();
    const files = formData.getAll("images").filter((file) => file instanceof File && file.type.startsWith("image/"));
    if (files.length === 0) {
      return Response.redirect(new URL("/userImageLibrary?shareError=empty", self.location.origin), 303);
    }

    await storeSharedImages(files);
    return Response.redirect(new URL("/userImageLibrary?shared=1", self.location.origin), 303);
  })());
});

function storeSharedImages(files) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(SHARE_STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(SHARE_STORE, "readwrite");
      transaction.objectStore(SHARE_STORE).put({ id: "pending", files });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}
