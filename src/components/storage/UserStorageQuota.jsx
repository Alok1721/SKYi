import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./userStorageQuota.css";

export const USER_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024;

const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// eslint-disable-next-line react/prop-types
const UserStorageQuota = ({ userId, valueOnly = false, compact = false }) => {
  const [usage, setUsage] = useState({ bytes: 0, imageCount: 0, untrackedCount: 0, loading: true, error: false });

  useEffect(() => {
    if (!userId) {
      setUsage({ bytes: 0, imageCount: 0, untrackedCount: 0, loading: false, error: false });
      return undefined;
    }

    const imagesQuery = query(collection(db, "saved_images"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(imagesQuery, (snapshot) => {
      const nextUsage = snapshot.docs.reduce((totals, imageDoc) => {
        const image = imageDoc.data();
        const imageBytes = Number(image.storageBytes ?? image.fileSizeBytes);
        totals.imageCount += 1;
        if (Number.isFinite(imageBytes) && imageBytes > 0) totals.bytes += imageBytes;
        else totals.untrackedCount += 1;
        return totals;
      }, { bytes: 0, imageCount: 0, untrackedCount: 0, loading: false, error: false });
      setUsage(nextUsage);
    }, (loadError) => {
      console.error("Unable to load image storage usage:", loadError);
      setUsage((currentUsage) => ({ ...currentUsage, loading: false, error: true }));
    });

    return unsubscribe;
  }, [userId]);

  if (valueOnly) {
    return usage.loading ? "…" : usage.error ? "—" : usage.imageCount;
  }

  const percentage = Math.min(100, (usage.bytes / USER_STORAGE_LIMIT_BYTES) * 100);
  const level = percentage >= 90 ? "critical" : percentage >= 70 ? "warning" : "normal";

  return (
    <div className={`storage-quota${compact ? " storage-quota-compact" : ""} ${level}`}>
      <div className="storage-quota-heading">
        <span>{compact ? "Storage" : "Storage used"}</span>
        <strong>{usage.loading ? "Loading…" : usage.error ? "Unavailable" : `${formatBytes(usage.bytes)} of 50 MB`}</strong>
      </div>
      <div
        className="storage-quota-track"
        role="progressbar"
        aria-label="Image storage used"
        aria-valuemin="0"
        aria-valuemax={USER_STORAGE_LIMIT_BYTES}
        aria-valuenow={usage.bytes}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <div className="storage-quota-foot">
        <span>{usage.loading ? " " : usage.error ? "Could not load usage" : `${Math.round(percentage)}% used`}</span>
        {!compact && <span>50 MB limit</span>}
      </div>
      {!usage.loading && !usage.error && usage.untrackedCount > 0 && (
        <p className="storage-quota-note">
          {usage.untrackedCount} older {usage.untrackedCount === 1 ? "image has" : "images have"} no size record and isn’t included.
        </p>
      )}
      {usage.error && <p className="storage-quota-note">Refresh the page to try loading your storage usage again.</p>}
    </div>
  );
};

export default UserStorageQuota;
