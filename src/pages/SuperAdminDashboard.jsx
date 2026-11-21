import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  FiActivity,
  FiAlertCircle,
  FiBookOpen,
  FiCloud,
  FiDatabase,
  FiRefreshCw,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { auth, db } from "../firebaseConfig";
import "../styles/superAdminDashboard.css";

const isCloudinaryUrl = (url) => typeof url === "string" && url.includes("cloudinary.com/");

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "Date unavailable";
};

const emptyMetrics = () => ({
  users: { total: 0, learners: 0, admins: 0, superAdmins: 0 },
  content: { standaloneQuestions: 0, quizzes: 0, quizQuestions: 0, pdfs: 0 },
  cloudinary: {
    bytes: 0,
    assets: 0,
    untracked: 0,
    categories: { "Profile photos": 0, "Image library": 0, "Question images": 0, "Quiz images": 0, PDFs: 0 },
  },
  contributors: [],
  recent: [],
  loadedAt: new Date(),
});

const makeMetrics = (usersSnapshot, questionsSnapshot, quizzesSnapshot, imagesSnapshot, pdfsSnapshot) => {
  const metrics = emptyMetrics();
  const usersById = new Map();
  const contributorsById = new Map();
  const ensureContributor = (id) => {
    const key = id || "unknown";
    if (!contributorsById.has(key)) {
      const profile = usersById.get(key);
      contributorsById.set(key, {
        id: key,
        name: profile?.name || profile?.displayName || (key === "unknown" ? "Unattributed uploader" : "Deleted account"),
        email: profile?.email || "",
        role: profile?.role || "user",
        questions: 0,
        quizzes: 0,
        quizQuestions: 0,
        pdfs: 0,
        cloudinaryBytes: 0,
        cloudinaryUntracked: 0,
      });
    }
    return contributorsById.get(key);
  };
  const addAsset = (url, bytes, category, uploaderId) => {
    if (!isCloudinaryUrl(url)) return;
    const contributor = ensureContributor(uploaderId);
    const size = Number(bytes);
    metrics.cloudinary.assets += 1;
    metrics.cloudinary.categories[category] += 1;
    if (Number.isFinite(size) && size > 0) {
      metrics.cloudinary.bytes += size;
      contributor.cloudinaryBytes += size;
    } else {
      metrics.cloudinary.untracked += 1;
      contributor.cloudinaryUntracked += 1;
    }
  };
  const recent = [];

  usersSnapshot.docs.forEach((userDoc) => {
    const user = userDoc.data();
    usersById.set(userDoc.id, user);
    metrics.users.total += 1;
    if (user.role === "admin") metrics.users.admins += 1;
    else if (user.role === "superadmin" || user.role === "super_admin") metrics.users.superAdmins += 1;
    else metrics.users.learners += 1;
    ensureContributor(userDoc.id);
    addAsset(user.photoURL, user.photoStorageBytes, "Profile photos", userDoc.id);
  });

  metrics.content.standaloneQuestions = questionsSnapshot.size;
  questionsSnapshot.docs.forEach((questionDoc) => {
    const question = questionDoc.data();
    ensureContributor(question.createdBy).questions += 1;
    addAsset(question.questionImage, question.questionImageBytes, "Question images", question.createdBy);
    addAsset(question.solutionImage, question.solutionImageBytes, "Question images", question.createdBy);
    recent.push({
      key: `question-${questionDoc.id}`,
      title: question.question || "Question added",
      kind: "Question",
      createdAt: question.createdAt,
    });
  });

  metrics.content.quizzes = quizzesSnapshot.size;
  quizzesSnapshot.docs.forEach((quizDoc) => {
    const quiz = quizDoc.data();
    const contributor = ensureContributor(quiz.createdBy);
    const quizQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
    contributor.quizzes += 1;
    contributor.quizQuestions += quizQuestions.length;
    metrics.content.quizQuestions += quizQuestions.length;
    quizQuestions.forEach((question) => {
      addAsset(question.questionImage, question.questionImageBytes, "Quiz images", quiz.createdBy);
      addAsset(question.solutionImage, question.solutionImageBytes, "Quiz images", quiz.createdBy);
    });
    recent.push({
      key: `quiz-${quizDoc.id}`,
      title: quiz.quizDescription || `${quiz.subject || "Mixed"} quiz`,
      kind: "Quiz",
      createdAt: quiz.createdAt,
    });
  });

  imagesSnapshot.docs.forEach((imageDoc) => {
    const image = imageDoc.data();
    addAsset(image.imageUrl, image.storageBytes ?? image.fileSizeBytes, "Image library", image.userId);
  });

  metrics.content.pdfs = pdfsSnapshot.size;
  pdfsSnapshot.docs.forEach((pdfDoc) => {
    const pdf = pdfDoc.data();
    ensureContributor(pdf.createdBy).pdfs += 1;
    addAsset(pdf.pdfLink, pdf.storageBytes, "PDFs", pdf.createdBy);
  });

  metrics.contributors = [...contributorsById.values()]
    .map((person) => ({ ...person, totalQuestions: person.questions + person.quizQuestions }))
    .sort((a, b) => b.cloudinaryBytes - a.cloudinaryBytes || a.name.localeCompare(b.name));
  metrics.recent = recent
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime() || 0;
      const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    })
    .slice(0, 6);
  metrics.loadedAt = new Date();
  return metrics;
};

// eslint-disable-next-line react/prop-types
const StatCard = ({ icon: Icon, label, value, detail, tone }) => (
  <article className={`sa-stat-card ${tone}`}>
    <span className="sa-stat-icon"><Icon /></span>
    <div>
      <p>{label}</p>
      <strong>{value.toLocaleString()}</strong>
      <small>{detail}</small>
    </div>
  </article>
);

const SuperAdminDashboard = () => {
  const [access, setAccess] = useState("checking");
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [users, questions, quizzes, images, pdfs] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "questions")),
        getDocs(collection(db, "quizzes")),
        getDocs(collection(db, "saved_images")),
        getDocs(collection(db, "pdfs")),
      ]);
      setMetrics(makeMetrics(users, questions, quizzes, images, pdfs));
    } catch (loadError) {
      console.error("Unable to load super admin analytics:", loadError);
      setError("Analytics could not be loaded. Check Firestore access for the superadmin role and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAccess("denied");
        return;
      }
      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (!active) return;
        const profile = userSnapshot.exists() ? userSnapshot.data() : null;
        if (profile?.role !== "superadmin" && profile?.role !== "super_admin") {
          setAccess("denied");
          return;
        }
        setAccess("allowed");
        await loadDashboard();
      } catch (loadError) {
        console.error("Unable to verify super admin access:", loadError);
        if (active) {
          setAccess("error");
          setError("Your super admin access could not be verified. Check your profile and Firestore rules.");
        }
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadDashboard]);

  if (access === "checking") {
    return <main className="sa-page"><div className="sa-state">Checking super admin access…</div></main>;
  }
  if (access !== "allowed") {
    return (
      <main className="sa-page">
        <div className="sa-state sa-state-error" role="alert">
          <FiShield />
          <h1>Super admin access required</h1>
          <p>{error || "Sign in with an account that has the superadmin role."}</p>
        </div>
      </main>
    );
  }

  const maxCategoryCount = Math.max(...Object.values(metrics.cloudinary.categories), 1);
  const accountRows = metrics.contributors.filter((person) => {
    const matchesSearch = `${person.name} ${person.email}`.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesRole = roleFilter === "all" ||
      (roleFilter === "superadmin"
        ? person.role === "superadmin" || person.role === "super_admin"
        : person.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <main className="sa-page">
      <header className="sa-heading">
        <div>
          <p className="sa-eyebrow">PLATFORM CONTROL CENTER</p>
          <h1>Super admin overview</h1>
          <p className="sa-subtitle">A live snapshot of accounts, learning content, and tracked media usage.</p>
        </div>
        <button className="sa-refresh" type="button" onClick={loadDashboard} disabled={loading}>
          <FiRefreshCw className={loading ? "sa-spinning" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <div className="sa-error" role="alert"><FiAlertCircle />{error}</div>}

      <section className="sa-stat-grid" aria-label="User roles">
        <StatCard icon={FiUsers} label="Total accounts" value={metrics.users.total} detail="All registered profiles" tone="blue" />
        <StatCard icon={FiUser} label="Learners" value={metrics.users.learners} detail="Profiles outside admin roles" tone="violet" />
        <StatCard icon={FiShield} label="Admins" value={metrics.users.admins} detail="Content administrators" tone="amber" />
        <StatCard icon={FiActivity} label="Super admins" value={metrics.users.superAdmins} detail="Platform operators" tone="green" />
      </section>

      <section className="sa-section">
        <div className="sa-section-heading">
          <div><p className="sa-eyebrow">CONTENT ACTIVITY</p><h2>Learning library</h2></div>
          <span className="sa-updated">Updated {formatDate(metrics.loadedAt)}</span>
        </div>
        <div className="sa-content-grid">
          <article className="sa-content-card"><span className="sa-content-icon"><FiBookOpen /></span><div><strong>{metrics.content.standaloneQuestions.toLocaleString()}</strong><p>Standalone questions</p></div></article>
          <article className="sa-content-card"><span className="sa-content-icon"><FiActivity /></span><div><strong>{metrics.content.quizzes.toLocaleString()}</strong><p>Quiz records</p></div></article>
          <article className="sa-content-card"><span className="sa-content-icon"><FiBookOpen /></span><div><strong>{metrics.content.quizQuestions.toLocaleString()}</strong><p>Questions inside quizzes</p></div></article>
          <article className="sa-content-card"><span className="sa-content-icon"><FiCloud /></span><div><strong>{metrics.content.pdfs.toLocaleString()}</strong><p>PDF resources</p></div></article>
        </div>
      </section>

      <section className="sa-section">
        <div className="sa-section-heading">
          <div><p className="sa-eyebrow">MEDIA FOOTPRINT</p><h2>Storage overview</h2></div>
          <span className="sa-tracking-label">Tracked from app uploads</span>
        </div>
        <div className="sa-storage-grid">
          <article className="sa-storage-card sa-cloudinary-card">
            <div className="sa-storage-title"><span className="sa-provider-icon cloudinary"><FiCloud /></span><div><h3>Cloudinary</h3><span className="sa-provider-status">App-tracked media</span></div></div>
            <strong className="sa-storage-amount">{formatBytes(metrics.cloudinary.bytes)}</strong>
            <p className="sa-storage-copy">{metrics.cloudinary.assets.toLocaleString()} Cloudinary assets detected across profiles, question content, PDFs and the image library.</p>
            <div className="sa-category-list">
              {Object.entries(metrics.cloudinary.categories).map(([category, count]) => (
                <div className="sa-category-row" key={category}>
                  <span>{category}</span><strong>{count}</strong>
                  <span className="sa-category-track"><i style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></span>
                </div>
              ))}
            </div>
            {metrics.cloudinary.untracked > 0 && (
              <p className="sa-storage-warning"><FiAlertCircle />{metrics.cloudinary.untracked} legacy asset(s) have no saved byte size; they’re excluded from the total.</p>
            )}
            <p className="sa-provider-note">Provider plan capacity and remaining quota aren’t available from the browser. This total includes only uploaded assets with recorded byte sizes.</p>
          </article>

          <div className="sa-provider-stack">
            <article className="sa-provider-card">
              <div className="sa-storage-title"><span className="sa-provider-icon firebase"><FiDatabase /></span><div><h3>Firebase Storage</h3><span className="sa-provider-status muted">Not instrumented</span></div></div>
              <p>No Firebase Storage upload flow is currently tracked in this app. Bucket usage and remaining quota must be read from Firebase Console or a trusted server integration.</p>
              <strong className="sa-unavailable">Usage unavailable</strong>
            </article>
            <article className="sa-provider-card">
              <div className="sa-storage-title"><span className="sa-provider-icon firestore"><FiDatabase /></span><div><h3>Firestore database</h3><span className="sa-provider-status muted">Provider metric</span></div></div>
              <p>The web SDK can report content counts, but not billed database bytes or remaining project quota.</p>
              <strong className="sa-unavailable">Quota unavailable</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="sa-section sa-bottom-grid">
        <article className="sa-panel">
          <div className="sa-panel-heading"><div><p className="sa-eyebrow">ACCOUNT STORAGE & ACTIVITY</p><h2>Usage by account</h2></div></div>
          <div className="sa-account-filters">
            <input
              type="search"
              aria-label="Search accounts"
              placeholder="Search name or email"
              value={accountSearch}
              onChange={(event) => setAccountSearch(event.target.value)}
            />
            <select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              <option value="user">Learners</option>
              <option value="admin">Admins</option>
              <option value="superadmin">Super admins</option>
            </select>
          </div>
          <p className="sa-table-note">Cloudinary shows tracked bytes for each account. Firebase Storage per-account usage is unavailable because this app does not currently upload files there.</p>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead><tr><th>Account</th><th>Role</th><th>Questions</th><th>Quizzes</th><th>PDFs</th><th>Cloudinary tracked</th><th>Firebase Storage</th></tr></thead>
              <tbody>
                {accountRows.length === 0 ? (
                  <tr><td colSpan="7" className="sa-empty">No matching accounts.</td></tr>
                ) : accountRows.map((person) => (
                  <tr key={person.id}>
                    <td><strong>{person.name}</strong><small>{person.email || (person.id === "unknown" ? "Older records may not include uploader ID" : "No email available")}</small></td>
                    <td><span className={`sa-role-badge ${person.role === "admin" ? "admin" : person.role === "superadmin" || person.role === "super_admin" ? "superadmin" : ""}`}>{person.role.replace("_", " ")}</span></td>
                    <td>{(person.totalQuestions).toLocaleString()}<small>{person.questions} standalone · {person.quizQuestions} in quizzes</small></td>
                    <td>{person.quizzes.toLocaleString()}</td>
                    <td>{person.pdfs.toLocaleString()}</td>
                    <td>{formatBytes(person.cloudinaryBytes)}{person.cloudinaryUntracked > 0 && <small>{person.cloudinaryUntracked} untracked asset(s)</small>}</td>
                    <td><span className="sa-unavailable-cell">Not tracked</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="sa-panel">
          <div className="sa-panel-heading"><div><p className="sa-eyebrow">RECENT CONTENT</p><h2>Latest uploads</h2></div></div>
          <ul className="sa-activity-list">
            {metrics.recent.length === 0 ? <li className="sa-empty">No recent content found.</li> : metrics.recent.map((item) => (
              <li key={item.key}>
                <span className={`sa-activity-dot ${item.kind === "Quiz" ? "quiz" : ""}`} />
                <div><strong>{item.title}</strong><small>{item.kind} · {formatDate(item.createdAt)}</small></div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
};

export default SuperAdminDashboard;
