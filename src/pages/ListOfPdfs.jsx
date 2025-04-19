import React, { useEffect, useState } from "react";
import "../styles/listOfPdfs.css";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { FiBarChart2, FiX } from 'react-icons/fi';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';
import { truncateText, formatGroupName } from '../utils/textUtils';

const ListOfPdfs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfs = [] } = location.state || {};
  const [filteredPdfs, setFilteredPdfs] = useState(pdfs);
  const [filter, setFilter] = useState("all");
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    monthlyStats: [],
    completionStats: []
  });

  useEffect(() => {
    const filterPdfs = () => {
      if (filter === "daywise") {
        return pdfs.filter((pdf) => pdf.type === "Daily-Current-Affair");
      } else if (filter === "monthwise") {
        return pdfs.filter((pdf) => pdf.type === "Monthly-Current-Affair");
      } else {
        return pdfs; // Show all PDFs
      }
    };
    setFilteredPdfs(filterPdfs());
  }, [filter, pdfs]);

  useEffect(() => {
    // Calculate analytics data
    const calculateAnalytics = () => {
      const monthlyData = {};
      let totalRead = 0;
      let totalUnread = 0;

      // Process each PDF
      pdfs.forEach(pdf => {
        const groupName = getGroupName(pdf.pdfName);
        const isRead = pdf.readBy?.includes(currentUserId);
        
        // Update monthly stats
        if (!monthlyData[groupName]) {
          monthlyData[groupName] = {
            month: formatGroupName(groupName),
            read: 0,
            unread: 0,
            total: 0
          };
        }
        monthlyData[groupName].total++;
        if (isRead) {
          monthlyData[groupName].read++;
          totalRead++;
        } else {
          monthlyData[groupName].unread++;
          totalUnread++;
        }
      });

      // Convert to array and sort by month
      const monthlyStats = Object.values(monthlyData).sort((a, b) => {
        const [monthA, yearA] = a.month.split(" ");
        const [monthB, yearB] = b.month.split(" ");
        const yearCompare = parseInt(yearB) - parseInt(yearA);
        if (yearCompare !== 0) return yearCompare;
        return getMonthNumber(monthB) - getMonthNumber(monthA);
      });

      // Calculate completion stats
      const completionStats = [
        { name: 'Completed', value: totalRead },
        { name: 'Not Completed', value: totalUnread }
      ];

      setAnalyticsData({
        monthlyStats,
        completionStats
      });
    };

    calculateAnalytics();
  }, [pdfs, currentUserId]);

  const handlePdfClick = async (pdf) => {
    try {
      // window.open(pdf.pdfLink, "_blank");
      navigate("/view-pdf", {
        state: {
          pdfUrl: pdf.pdfLink,
          pdfName: pdf.pdfName
        }
      });
      
      const pdfRef = doc(db, "pdfs", pdf.id);
      await updateDoc(pdfRef, {
        readBy: arrayUnion(currentUserId),
      });

      alert("Good job! Marked as read by you.");
    } catch (error) {
      console.error("Error updating PDF:", error);
    }
  };

  const getGroupName = (filename) => {
    if (!filename) return "other";
    const dateParts = filename.split(" ");
    if (dateParts.length >= 2) {
      return `${dateParts[dateParts.length - 2]} ${dateParts[dateParts.length - 1].replace(".pdf", "")}`.toLowerCase();
    }
    return "other";
  };

  const getDay = (filename) => {
    if (!filename) return 0;
    const dateParts = filename.split(" ");
    if (dateParts.length >= 3) {
      return parseInt(dateParts[0], 10);
    }
    return 0; 
  };

  const getMonthNumber = (monthName) => {
    const months = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    return months[monthName.toLowerCase()] || 0;
  };

  const groupedPdfs = filteredPdfs.reduce((acc, pdf) => {
    const groupName = getGroupName(pdf.pdfName);
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(pdf);
    return acc;
  }, {});

  const sortedGroupedPdfs = Object.keys(groupedPdfs)
    .sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      const yearCompare = parseInt(yearB) - parseInt(yearA);
      if (yearCompare !== 0) return yearCompare;
      return getMonthNumber(monthB) - getMonthNumber(monthA);
    })
    .reduce((acc, groupName) => {
      acc[groupName] = groupedPdfs[groupName].sort((a, b) => {
        const dayA = getDay(a.pdfName);
        const dayB = getDay(b.pdfName);
        return dayB - dayA; // Sort in decreasing order
      });
      return acc;
    }, {});

  const COLORS = {
    light: {
      read: '#4CAF50',
      unread: '#FF5252',
      text: '#000000',
      grid: '#E0E0E0'
    },
    dark: {
      read: '#66BB6A',
      unread: '#FF6B6B',
      text: '#FFFFFF',
      grid: '#424242'
    }
  };

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const currentColors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <div className="list-of-pdfs">
      <div className="header-section">
        <h2>Current Affairs PDFs</h2>
        <button 
          className="analytics-toggle"
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          {showAnalytics ? <FiX /> : <FiBarChart2 />}
        </button>
      </div>

      {showAnalytics && (
        <AnalyticsCharts
          monthlyStats={analyticsData.monthlyStats}
          completionStats={analyticsData.completionStats}
          title="PDF Analytics"
        />
      )}

      <div className="filter-options">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "daywise" ? "active" : ""}
          onClick={() => setFilter("daywise")}
        >
          Daywise
        </button>
        <button
          className={filter === "monthwise" ? "active" : ""}
          onClick={() => setFilter("monthwise")}
        >
          Monthwise
        </button>
      </div>

      {Object.entries(sortedGroupedPdfs).map(([groupName, pdfsInGroup]) => (
        <div key={groupName} className="pdf-section">
          <h3 className="section-title">{formatGroupName(groupName)}</h3>
          <div className="pdf-grid">
            {pdfsInGroup.map((pdf) => (
              <div
                key={pdf.id}
                className={`pdf-card ${pdf.readBy?.includes(currentUserId) ? "read-by-me" : ""}`}
                onClick={() => handlePdfClick(pdf)}
              >
                <div className="pdf-content">
                  <h3 title={pdf.pdfName}>{truncateText(pdf.pdfName, 30)}</h3>
                  <div className="pdf-meta">
                    <span className="pdf-description">Read by: {pdf.readBy?.length || 0} users</span>
                  </div>
                  <div className="pdf-status">
                    {pdf.readBy?.includes(currentUserId) ? "Read" : "Unread"}
                  </div>
                </div>
                <div className="pdf-icon">
                  {pdf.readBy?.includes(currentUserId) ? "✓" : "?"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListOfPdfs;