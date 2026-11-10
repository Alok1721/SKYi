import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { FiFolder, FiImage, FiPlus, FiSearch, FiUpload, FiX } from "react-icons/fi";
import { auth, db } from "../firebaseConfig";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";
import "../styles/userImageLibrary.css";

const SHARE_DB = "skyi-image-shares";
const SHARE_STORE = "inbound";

function readSharedImages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(SHARE_STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(SHARE_STORE, "readonly");
      const readRequest = transaction.objectStore(SHARE_STORE).get("pending");
      readRequest.onsuccess = () => resolve(readRequest.result?.files || []);
      readRequest.onerror = () => reject(readRequest.error);
    };
  });
}

function clearSharedImages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(SHARE_STORE, "readwrite");
      transaction.objectStore(SHARE_STORE).delete("pending");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

function updateSharedImages(files) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(SHARE_STORE, "readwrite");
      const store = transaction.objectStore(SHARE_STORE);
      if (files.length) store.put({ id: "pending", files });
      else store.delete("pending");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

const UserImageLibrary = () => {
  const [images, setImages] = useState([]);
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("All images");
  const [selectedImage, setSelectedImage] = useState(null);
  const [search, setSearch] = useState("");
  const [draftFile, setDraftFile] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [folder, setFolder] = useState("Unfiled");
  const [subject, setSubject] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const currentFile = draftFile || sharedFiles[0] || null;
  const previewUrl = useMemo(() => currentFile ? URL.createObjectURL(currentFile) : "", [currentFile]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const loadImages = useCallback(async () => {
    if (!user) {
      setImages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const savedImages = await getDocs(query(collection(db, "saved_images"), where("userId", "==", user.uid)));
      const records = savedImages.docs.map((imageDoc) => ({ id: imageDoc.id, ...imageDoc.data() }));
      records.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setImages(records);
    } catch (loadError) {
      console.error("Unable to load saved images:", loadError);
      setError("Your image library could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    const isShared = searchParams.get("shared") === "1";
    if (!isShared) return;
    let active = true;
    readSharedImages()
      .then((files) => {
        if (!active) return;
        if (files.length) {
          setSharedFiles(files);
          setHeading(files[0].name?.replace(/\.[^.]+$/, "") || "");
          setIsModalOpen(true);
          setNotice("Image received from sharing. Add details to save it.");
        } else {
          setError("No image was received. Try sharing the image again.");
        }
      })
      .catch((shareError) => {
        console.error("Unable to read shared images:", shareError);
        if (active) setError("The shared image could not be opened.");
      })
      .finally(() => {
        if (active) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("shared");
          setSearchParams(nextParams, { replace: true });
        }
      });
    return () => { active = false; };
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get("shareError") === "empty") {
      setError("The shared item was not an image.");
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("shareError");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const folders = useMemo(() => [...new Set(images.map((image) => image.folder || "Unfiled"))].sort(), [images]);
  const availableTags = useMemo(() => [...new Set(images.flatMap((image) => image.tags || []))].sort(), [images]);
  const visibleImages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return images.filter((image) => {
      const inFolder = selectedFolder === "All images" || (image.folder || "Unfiled") === selectedFolder;
      const searchableText = [image.heading, image.description, image.subject, image.folder, ...(image.tags || [])]
        .join(" ").toLowerCase();
      return inFolder && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [images, search, selectedFolder]);

  const startWithFile = (file) => {
    if (!file?.type?.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setNotice("");
    setDraftFile(file);
    setHeading(file.name?.replace(/\.[^.]+$/, "") || "");
    setDescription("");
    setFolder(selectedFolder === "All images" ? "Unfiled" : selectedFolder);
    setSubject("");
    setTagsText("");
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const pastedImage = Array.from(event.clipboardData?.items || [])
        .find((item) => item.type.startsWith("image/"))?.getAsFile();
      if (pastedImage) {
        event.preventDefault();
        startWithFile(pastedImage);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  const closeModal = async () => {
    setIsModalOpen(false);
    setDraftFile(null);
    setError("");
    if (sharedFiles.length) {
      try {
        await clearSharedImages();
        setSharedFiles([]);
      } catch (clearError) {
        console.error("Unable to clear pending shared images:", clearError);
      }
    }
  };

  const saveImage = async (event) => {
    event.preventDefault();
    if (!user) {
      setError("Please sign in to save images to your library.");
      return;
    }
    if (!currentFile) {
      setError("Choose or paste an image before saving.");
      return;
    }
    if (!heading.trim()) {
      setError("Add a heading for this image.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const imageUrl = await uploadToCloudinary(currentFile, "image");
      await addDoc(collection(db, "saved_images"), {
        userId: user.uid,
        heading: heading.trim(),
        description: description.trim(),
        tags: [...new Set(tagsText.split(",").map((tag) => tag.trim()).filter(Boolean))],
        folder: folder.trim() || "Unfiled",
        subject: subject.trim(),
        imageUrl,
        createdAt: serverTimestamp(),
      });

      const remainingSharedFiles = sharedFiles.length ? sharedFiles.slice(1) : [];
      if (sharedFiles.length) {
        await updateSharedImages(remainingSharedFiles);
        if (remainingSharedFiles.length) {
          setSharedFiles(remainingSharedFiles);
          setHeading(remainingSharedFiles[0].name?.replace(/\.[^.]+$/, "") || "");
          setDescription("");
          setTagsText("");
          setSubject("");
          setFolder("Unfiled");
          setNotice(`${sharedFiles.length} shared image${sharedFiles.length === 1 ? "" : "s"} saved. Add details to the next one.`);
        } else {
          await clearSharedImages();
          setSharedFiles([]);
          setIsModalOpen(false);
          setNotice("Image saved to your library.");
        }
      } else {
        setIsModalOpen(false);
        setDraftFile(null);
        setNotice("Image saved to your library.");
      }
      await loadImages();
    } catch (saveError) {
      console.error("Unable to save image:", saveError);
      setError(`Unable to save image: ${saveError.message || "Please try again."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    startWithFile(event.dataTransfer.files[0]);
  };

  return (
    <main className="image-library" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <header className="image-library-header">
        <div>
          <p className="image-library-eyebrow">YOUR VISUAL SPACE</p>
          <h1>Image library</h1>
          <p className="image-library-subtitle">Keep screenshots, ideas, and inspiration together.</p>
        </div>
        <button className="image-library-add" type="button" onClick={() => fileInputRef.current?.click()}>
          <FiPlus /> Add image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            if (event.target.files?.[0]) startWithFile(event.target.files[0]);
            event.target.value = "";
          }}
        />
      </header>

      <div className="image-library-toolbar">
        <label className="image-library-search">
          <FiSearch />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search images, tags, subjects..." />
        </label>
        <p><FiImage /> {images.length} {images.length === 1 ? "image" : "images"}</p>
      </div>

      {notice && <div className="image-library-notice" role="status">{notice}</div>}
      {error && !isModalOpen && <div className="image-library-error" role="alert">{error}</div>}

      <div className="image-library-layout">
        <aside className="image-library-folders" aria-label="Image folders">
          <h2>Folders</h2>
          <button
            type="button"
            className={selectedFolder === "All images" ? "active" : ""}
            onClick={() => setSelectedFolder("All images")}
          >
            <FiImage /> All images <span>{images.length}</span>
          </button>
          {folders.map((name) => (
            <button
              type="button"
              key={name}
              className={selectedFolder === name ? "active" : ""}
              onClick={() => setSelectedFolder(name)}
            >
              <FiFolder /> {name} <span>{images.filter((image) => (image.folder || "Unfiled") === name).length}</span>
            </button>
          ))}
        </aside>

        <section className="image-library-content" aria-label="Saved images">
          {loading ? (
            <p className="image-library-empty">Loading your images...</p>
          ) : visibleImages.length ? (
            <div className="image-library-grid">
              {visibleImages.map((image) => (
                <article className="image-library-card" key={image.id}>
                  <button
                    className="image-library-image-button"
                    type="button"
                    aria-label={`View ${image.heading} full size`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img src={image.imageUrl} alt={image.heading} loading="lazy" />
                  </button>
                  <div className="image-library-card-details">
                    <h2>{image.heading}</h2>
                    {image.description && <p>{image.description}</p>}
                    <div className="image-library-card-meta">
                      <span><FiFolder /> {image.folder || "Unfiled"}</span>
                      {image.subject && <span>{image.subject}</span>}
                    </div>
                    {image.tags?.length > 0 && (
                      <div className="image-library-tags">{image.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
                    )}
                    <time>
                      {image.createdAt?.toDate
                        ? image.createdAt.toDate().toLocaleString()
                        : "Recently saved"}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="image-library-empty-state">
              <span><FiImage /></span>
              <h2>{images.length ? "No images in this view" : "Your visual space starts here"}</h2>
              <p>Paste a copied image with Ctrl+V, drop an image here, or add one from your device.</p>
              <button type="button" onClick={() => fileInputRef.current?.click()}><FiUpload /> Add your first image</button>
            </div>
          )}
        </section>
      </div>

      {selectedImage && (
        <div
          className="image-library-lightbox"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedImage(null);
          }}
        >
          <section
            className="image-library-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedImage.heading} full-size image`}
          >
            <button
              className="image-library-lightbox-close"
              type="button"
              aria-label="Close full-size image"
              onClick={() => setSelectedImage(null)}
            >
              <FiX />
            </button>
            <img src={selectedImage.imageUrl} alt={selectedImage.heading} />
            <p>{selectedImage.heading}</p>
          </section>
        </div>
      )}

      {isModalOpen && (
        <div className="image-library-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) closeModal();
        }}>
          <form className="image-library-modal" onSubmit={saveImage}>
            <div className="image-library-modal-header">
              <div><p>ADD TO YOUR LIBRARY</p><h2>Image details</h2></div>
              <button type="button" aria-label="Close" disabled={isSaving} onClick={closeModal}><FiX /></button>
            </div>
            <div className="image-library-modal-body">
              {previewUrl && <img className="image-library-preview" src={previewUrl} alt="Selected image preview" />}
              <label>Heading <span>*</span><input value={heading} onChange={(event) => setHeading(event.target.value)} required maxLength={120} /></label>
              <label>Description <small>Optional</small><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="3" maxLength={1000} /></label>
              <div className="image-library-field-row">
                <label>Folder<input value={folder} onChange={(event) => setFolder(event.target.value)} maxLength={80} placeholder="e.g. Travel ideas" /></label>
                <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={80} placeholder="e.g. Biology" /></label>
              </div>
              <label>Tags <small>Separate with commas; existing tags are suggested</small><input list="image-library-existing-tags" value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="ideas, notes, reference" maxLength={300} /><datalist id="image-library-existing-tags">{availableTags.map((tag) => <option key={tag} value={tag} />)}</datalist></label>
              <p className="image-library-date">Saved date and time: {new Date().toLocaleString()} (automatically recorded)</p>
              {error && <p className="image-library-error" role="alert">{error}</p>}
            </div>
            <footer className="image-library-modal-footer">
              <button type="button" className="image-library-cancel" disabled={isSaving} onClick={closeModal}>Cancel</button>
              <button type="submit" className="image-library-save" disabled={isSaving}>{isSaving ? "Saving..." : "Save image"}</button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
};

export default UserImageLibrary;
