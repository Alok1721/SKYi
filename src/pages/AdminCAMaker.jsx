import React, { useEffect, useState } from "react";
import "../styles/adminQuestionMaker.css"; // Reuse the same CSS file
import { db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, doc, arrayUnion, getDocs } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";  

const AdminCAMaker = () => {
  const [pdfs, setPdfs] = useState([
    {
      pdfName: "",
      pdfFile: null, // Store PDF file
      pdfLink: "",
      pdfThumbnail: "", // Store PDF preview image
      type: "Daily-Current-Affair", // Default type
      playlists: [], // Store multiple playlists for each PDF
    },
  ]);
  const [allPlaylists, setAllPlaylists] = useState([]); // Store all playlists from Firestore

  // Fetch playlists from Firestore
  useEffect(() => {
    const fetchPlaylists = async () => {
      const querySnapshot = await getDocs(collection(db, "playlists"));
      const playlistData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setAllPlaylists(playlistData);
    };
    fetchPlaylists();
  }, []);

  // Handle file selection
  const handleFileChange = (index, file) => {
    const newPdfs = [...pdfs];
    newPdfs[index].pdfFile = file;
    newPdfs[index].pdfName = file.name; // Auto-fill PDF name
    setPdfs(newPdfs);
  };

  // Add a new PDF block
  const handleAddPdf = () => {
    setPdfs([
      ...pdfs,
      {
        pdfName: "",
        pdfFile: null,
        pdfLink: "",
        pdfThumbnail: "",
        type: "Daily-Current-Affair",
        playlists: [],
      },
    ]);
  };

  // Handle input changes
  const handleChange = (index, field, value) => {
    const newPdfs = [...pdfs];
    newPdfs[index][field] = value;
    setPdfs(newPdfs);
  };

  // Handle playlist selection
  const handlePlaylistSelection = (index, playlistId) => {
    const newPdfs = [...pdfs];
    const selectedPlaylists = newPdfs[index].playlists;

    if (selectedPlaylists.includes(playlistId)) {
      newPdfs[index].playlists = selectedPlaylists.filter((id) => id !== playlistId);
    } else {
      newPdfs[index].playlists = [...selectedPlaylists, playlistId];
    }

    setPdfs(newPdfs);
  };

  // Submit PDFs
  const handleSubmit = async () => {
    try {
      for (let i = 0; i < pdfs.length; i++) {
        const pdf = pdfs[i];
  
        if (!pdf.pdfName || !pdf.pdfFile || pdf.playlists.length === 0) {
          alert("Please select a PDF file and choose at least one playlist.");
          return;
        }
  
        // Check file size (optional)
        if (pdf.pdfFile.size > 100 * 1024 * 1024) { // 100 MB limit
          alert(`File "${pdf.pdfName}" exceeds the 100 MB size limit.`);
          continue; // Skip this file
        }
  
        // Show upload progress
        console.log(`Uploading ${i + 1}/${pdfs.length}: ${pdf.pdfName}`);
  
        // Upload PDF to Cloudinary
        const pdfUrl = await uploadToCloudinary(pdf.pdfFile);
  
        if (!pdfUrl) {
          alert(`Failed to upload "${pdf.pdfName}". Please try again.`);
          continue; // Skip this file
        }
  
        console.log("Upload successful. pdfUrl:", pdfUrl);
  
        // Generate thumbnail URL (Cloudinary supports generating thumbnails from PDFs)
        const pdfThumbnail = pdfUrl.replace("/upload/", "/upload/w_200,h_300,pg_1/"); // First page thumbnail
  
        // Add PDF to Firestore
        const pdfRef = await addDoc(collection(db, "pdfs"), {
          pdfName: pdf.pdfName,
          pdfLink: pdfUrl,
          pdfThumbnail: pdfThumbnail,
          type: pdf.type,
          createdAt: new Date(),
          readBy: [],
        });
  
        // Update all selected playlists with the new PDF ID
        for (const playlistId of pdf.playlists) {
          const playlistRef = doc(db, "playlists", playlistId);
          await updateDoc(playlistRef, {
            pdfs: arrayUnion(pdfRef.id),
            updatedAt: new Date(),
          });
        }
      }
  
      alert("All PDFs added successfully!");
      setPdfs([
        {
          pdfName: "",
          pdfFile: null,
          pdfLink: "",
          pdfThumbnail: "",
          type: "Daily-Current-Affair",
          playlists: [],
        },
      ]);
    } catch (error) {
      console.error("Error adding PDFs:", error);
    }
  };

  return (
    <div className="admin-question-container">
      <h2>Add PDFs</h2>
      {pdfs.map((pdf, index) => (
        <div key={index} className="question-block">
          <div className="form-group">
            <label>PDF File:</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(index, e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label>PDF Name:</label>
            <input
              type="text"
              placeholder="Enter PDF Name"
              value={pdf.pdfName}
              onChange={(e) => handleChange(index, "pdfName", e.target.value)}
            />
          </div>

          {/* Display PDF Thumbnail if available */}
          {pdf.pdfThumbnail && (
            <div className="pdf-thumbnail">
              <img src={pdf.pdfThumbnail} alt="PDF Preview" />
            </div>
          )}

          <div className="form-group">
            <label>Type:</label>
            <select
              value={pdf.type}
              onChange={(e) => handleChange(index, "type", e.target.value)}
            >
              <option value="Daily-Current-Affair">Daily Current Affair</option>
              <option value="Monthly-Current-Affair">Monthly Current Affair</option>
              <option value="Custom-Affair">Custom Affair</option>
            </select>
          </div>

          <div className="form-group">
            <label>Playlists:</label>
            <div className="playlist-cards">
              {allPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`playlist-card ${pdf.playlists.includes(playlist.id) ? "selected" : ""}`}
                  onClick={() => handlePlaylistSelection(index, playlist.id)}
                >
                  {playlist.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="action-buttons">
        <button onClick={handleAddPdf} className="add-question-btn">
          Add Another PDF
        </button>
        <button onClick={handleSubmit} className="submit-btnn">
          Post PDFs
        </button>
      </div>
    </div>
  );
};

export default AdminCAMaker;
