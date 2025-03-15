import React, { useEffect, useState } from "react";
import "../styles/listOfPdfs.css"; // Import CSS file
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

const ListOfPdfs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfs } = location.state || { pdfs: [] }; 
  const [filteredPdfs, setFilteredPdfs] = useState(pdfs);
  const [filter, setFilter] = useState("all"); 
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

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

  const handlePdfClick = async (pdf) => {
    try {
      window.open(pdf.pdfLink, "_blank");
      const pdfRef = doc(db, "pdfs", pdf.id);
      await updateDoc(pdfRef, {
        readBy: arrayUnion(currentUserId),
      });

      alert("Good job! Marked as read by you.");
    } catch (error) {
      console.error("Error updating PDF:", error);
    }
  };

  return (
    <div className="list-of-pdfs">
      <h2>Current Affairs PDFs</h2>

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

      <div className="pdf-grid">
        {filteredPdfs.map((pdf) => (
          <div key={pdf.id} className={`pdf-card ${pdf.readBy?.includes(currentUserId) ? "read-by-me" : ""}`} onClick={() => handlePdfClick(pdf)}>
            {pdf.thumbnail && (
              <img src={pdf.thumbnail} alt="PDF Thumbnail" className="pdf-thumbnail" />
            )}
            <div className="pdf-details">
              <h3>{pdf.pdfName}</h3>
              <p>{pdf.type}</p>
              <p>Read by: {pdf.readBy?.length || 0} users</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListOfPdfs;