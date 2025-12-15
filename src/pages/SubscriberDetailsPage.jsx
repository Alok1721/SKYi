import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, realtimeDB } from "../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { fetchSubmissionsByUserId } from "../firebaseServices/submission_service";
import "../styles/subscriberDetailsPage.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { formatDateTime } from "../utils/date_time";

/* ---------------- FILTER CONFIG ---------------- */
const TIME_FILTERS = [
  { key: "this-week", label: "This Week", type: "week" },
  { key: "this-month", label: "This Month", type: "month" },
  { key: "last-3-months", label: "Last 3 Months", type: "range", months: 3 },
  { key: "last-6-months", label: "Last 6 Months", type: "range", months: 6 },
  { key: "this-year", label: "This Year", type: "year", year: new Date().getFullYear() },
  { key: "last-year", label: "Last Year", type: "year", year: new Date().getFullYear() - 1 },
];

/* ---------------- HELPERS ---------------- */
const calculateStats = (list) => {
  let totalCorrect = 0;
  let totalIncorrect = 0;
  list.forEach((s) => {
    totalCorrect += s.quizResult?.totalCorrect || 0;
    totalIncorrect += s.quizResult?.totalIncorrect || 0;
  });
  const attempted = totalCorrect + totalIncorrect;
  return {
    submissions: list.length,
    totalCorrect,
    totalIncorrect,
    accuracy: attempted ? Math.round((totalCorrect / attempted) * 100) : 0,
  };
};

const resolveDateRange = (filter) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  switch (filter.type) {
    case "week":
      start.setDate(now.getDate() - now.getDay());
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "range":
      start.setMonth(now.getMonth() - filter.months);
      break;
    case "year":
      start = new Date(filter.year, 0, 1);
      end = new Date(filter.year, 11, 31);
      break;
    default:
      start = new Date(0);
  }
  return { start, end };
};

/* ---------------- COMPONENT ---------------- */
const SubscriberDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [podData, setPodData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chartFilter, setChartFilter] = useState(TIME_FILTERS[1]);
  const [podFilter, setPodFilter] = useState(TIME_FILTERS[1]);

  const [isOnline, setIsOnline] = useState(false);
  const [lastActive, setLastActive] = useState(null);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (!userSnap.exists()) return;
        const user = userSnap.data();
        setUserData(user);

        const subs = await fetchSubmissionsByUserId(userId);
        setSubmissions(subs || []);

        if (user.subscribedExam) {
          const refProgress = collection(db, `user_progress/${userId}/${user.subscribedExam}`);
          const snap = await getDocs(refProgress);
          const g = [];
          const p = [];
          snap.forEach((d) => {
            g.push({ date: d.id, value: d.data().correctPercentage || 0 });
            p.push({ date: d.id, completedPOD: d.data().completedPOD === true });
          });
          setGraphData(g.sort((a, b) => new Date(a.date) - new Date(b.date)));
          setPodData(p);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  /* ---------------- ONLINE STATUS ---------------- */
  useEffect(() => {
    const statusRef = ref(realtimeDB, `status/${userId}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsOnline(data.isOnline);
        setLastActive(data.lastActive);
      }
    });
    return () => unsubscribe();
  }, [userId]);

  /* ---------------- STATS ---------------- */
  const todayStr = new Date().toDateString();
  const todaySubs = useMemo(
    () => submissions.filter(s => new Date(s.timeStamp).toDateString() === todayStr),
    [submissions]
  );
  const todayStats = useMemo(() => calculateStats(todaySubs), [todaySubs]);
  const overallStats = useMemo(() => calculateStats(submissions), [submissions]);

  /* ---------------- GRAPH FILTER ---------------- */
  const filteredGraphData = useMemo(() => {
    const { start, end } = resolveDateRange(chartFilter);
    return graphData.filter((d) => {
      const date = new Date(d.date);
      return date >= start && date <= end;
    });
  }, [graphData, chartFilter]);

  /* ---------------- POD ---------------- */
  const podDays = useMemo(() => {
    const { start, end } = resolveDateRange(podFilter);
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [podFilter]);

  const podMap = useMemo(() => {
    const map = {};
    podData.forEach((p) => { if (p.completedPOD) map[p.date] = true; });
    return map;
  }, [podData]);

  /* ---------------- SUBMISSIONS FILTER + PAGINATION ---------------- */
  const ITEMS_PER_PAGE = 25;
  const [submissionFilter, setSubmissionFilter] = useState(TIME_FILTERS[1]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSubmissions = useMemo(() => {
    const { start, end } = resolveDateRange(submissionFilter);
    return submissions.filter((s) => {
      const date = new Date(s.timeStamp);
      return date >= start && date <= end;
    });
  }, [submissions, submissionFilter]);

  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const currentSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading analytics...</p>;
  if (!userData) return <p>User not found</p>;

  /* ---------------- RENDER ---------------- */
  return (
    <div className="subscriber-details-page">
      {/* HEADER */}
      <div className="subscriber-header">
        <h2>{userData.name}</h2>
        <p>{userData.email}</p>
        <span className="role-badge">{userData.role}</span>
        <div className="user-status" style={{ marginTop: "8px" }}>
          Status: {isOnline ? (
            <span style={{ color: "#10b981" }}>Online</span>
          ) : (
            <span style={{ color: "#ef4444" }}>Offline</span>
          )}
          {!isOnline && lastActive && (
            <> | Last Active: {format(new Date(lastActive), "dd MMM yyyy, HH:mm")}</>
          )}
        </div>
      </div>

      {/* TODAY */}
      <section className="analytics-card">
        <h3>📅 Today</h3>
        <div className="stats-grid">
          <div className="stat-box"><span>Submissions</span><strong>{todayStats.submissions}</strong></div>
          <div className="stat-box success"><span>Correct</span><strong>{todayStats.totalCorrect}</strong></div>
          <div className="stat-box danger"><span>Incorrect</span><strong>{todayStats.totalIncorrect}</strong></div>
          <div className="stat-box info"><span>Accuracy</span><strong>{todayStats.accuracy}%</strong></div>
        </div>
      </section>

      {/* OVERALL */}
      <section className="analytics-card">
        <h3>📊 Overall</h3>
        <div className="stats-grid">
          <div className="stat-box"><span>Submissions</span><strong>{overallStats.submissions}</strong></div>
          <div className="stat-box success"><span>Correct</span><strong>{overallStats.totalCorrect}</strong></div>
          <div className="stat-box danger"><span>Incorrect</span><strong>{overallStats.totalIncorrect}</strong></div>
          <div className="stat-box info"><span>Accuracy</span><strong>{overallStats.accuracy}%</strong></div>
        </div>
      </section>

      {/* CHART + POD */}
      <div className="subscriber-analytics-layout">
        {/* CHART */}
        <div className="chart-wrapper" ref={chartRef}>
          <div className="wrapper-header">
            <h3 className="wrapper-heading">📈 Day-Wise Progress</h3>
            <select
              className="chart-filter"
              value={chartFilter.key}
              onChange={(e) =>
                setChartFilter(TIME_FILTERS.find((f) => f.key === e.target.value))
              }
            >
              {TIME_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="chart">
            <LineChart
              width={chartRef.current?.offsetWidth || 500}
              height={220}
              data={filteredGraphData}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "dd MMM")} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </div>
        </div>

        {/* POD Tracker */}
        <div className="calender-wrapper">
          <div className="wrapper-header">
            <h3 className="wrapper-heading">📆 POD Tracker</h3>
            <select
              className="chart-filter"
              value={podFilter.key}
              onChange={(e) => setPodFilter(TIME_FILTERS.find(f => f.key === e.target.value))}
            >
              {TIME_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>

          <div className="calendar-container-wrapper">
            <div className="calendar-scroll">
              {(() => {
                const now = new Date();
                let monthsToRender = [];

                if (podFilter.key === "this-week") {
                  monthsToRender = [{ name: "This Week", days: podDays.slice(0, 7) }];
                } else if (podFilter.key === "this-month") {
                  monthsToRender = [{ name: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`, days: podDays }];
                } else if (podFilter.key === "last-3-months" || podFilter.key === "last-6-months") {
                  const monthsCount = podFilter.key === "last-3-months" ? 3 : 6;
                  for (let i = monthsCount - 1; i >= 0; i--) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthName = monthDate.toLocaleString("default", { month: "long" });
                    const year = monthDate.getFullYear();
                    const daysInMonth = new Date(year, monthDate.getMonth() + 1, 0).getDate();
                    const monthDays = Array.from({ length: daysInMonth }, (_, idx) => {
                      const d = new Date(year, monthDate.getMonth(), idx + 1);
                      return d.toISOString().split("T")[0];
                    });
                    monthsToRender.push({ name: `${monthName} ${year}`, days: monthDays });
                  }
                } else if (podFilter.key === "this-year" || podFilter.key === "last-year") {
                  const year = podFilter.key === "this-year" ? now.getFullYear() : now.getFullYear() - 1;
                  for (let m = 0; m < 12; m++) {
                    const monthName = new Date(year, m).toLocaleString("default", { month: "long" });
                    const daysInMonth = new Date(year, m + 1, 0).getDate();
                    const monthDays = Array.from({ length: daysInMonth }, (_, idx) => {
                      const d = new Date(year, m, idx + 1);
                      return d.toISOString().split("T")[0];
                    });
                    monthsToRender.push({ name: `${monthName} ${year}`, days: monthDays });
                  }
                }

                return monthsToRender.map((month) => (
                  <div key={month.name} className="calendar-month" style={{ marginRight: "16px" }}>
                    <h4 className="month-title">{month.name}</h4>
                    <div className="calendar-grid">
                      {month.days.map((date) => (
                        <div key={date} className={`calendar-box ${podMap[date] ? "completed-pod" : ""}`} title={date} />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSIONS */}
      <section className="submission-section">
        <div className="submission-header">
          <h3>🧾 All Submissions</h3>
          <select
            className="submission-filter"
            value={submissionFilter.key}
            onChange={(e) => {
              setSubmissionFilter(TIME_FILTERS.find(f => f.key === e.target.value));
              setCurrentPage(1);
            }}
          >
            {TIME_FILTERS.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>

        <table className="submission-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Exam</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentSubmissions.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.timeStamp)}</td>
                <td>{s.examName || "-"}</td>
                <td>{s.quizResult?.score ?? "-"}</td>
                <td>{s.quizResult?.correctPercentage ?? "-"}%</td>
                <td>
                  {s.quizResult && (
                    <button
                      className="view-btn"
                      onClick={() => navigate("/quizResult", { state: s.quizResult })}
                    >
                      View Result
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Buttons */}
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? "active-page" : ""}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default SubscriberDetailsPage;
