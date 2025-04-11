import React, { useEffect, useState } from "react";
import "../styles/adminQuestionMaker.css"; // Reuse the same CSS file
import { db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, doc, arrayUnion, getDocs } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";  
import {sendBrevoEmail} from "../emailServices/emailFunctions";
import { getSubscribedUsers } from "../firebaseServices/firestoreUtils";
import { PDFEmailTemplate } from "../emailServices/emailTemplates";
import LoadingScreen from "../components/loadingScreen/LoadingScreen"; // Reuse the loading screen component

const AdminCAMaker = () => {
  const [pdfs, setPdfs] = useState([
    {
      pdfName: "",
      pdfFile: null, 
      pdfLink: "",
      pdfThumbnail: "", 
      type: "Daily-Current-Affair",
      playlists: [], 
    },
  ]);
  const [allPlaylists, setAllPlaylists] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFileChange = (index, file) => {
    const newPdfs = [...pdfs];
    newPdfs[index].pdfFile = file;
    newPdfs[index].pdfName = file.name; 
    setPdfs(newPdfs);
  };

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

  const handleChange = (index, field, value) => {
    const newPdfs = [...pdfs];
    newPdfs[index][field] = value;
    setPdfs(newPdfs);
  };

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

  const sendPdfNotification = async () => {
    try {
      const recipients = await getSubscribedUsers();
      const pdfsByType = {};
      pdfs.forEach((pdf) => {
        if (!pdfsByType[pdf.type]) {
          pdfsByType[pdf.type] = [];
        }
        pdfsByType[pdf.type].push(pdf.pdfName);
      });
  
      let emailContent = "<p>The following PDFs have been uploaded:</p>";
      
      for (const [type, pdfNames] of Object.entries(pdfsByType)) {
        emailContent += `<h3>${type}</h3><ul>`;
        emailContent += pdfNames.map((name) => `<li>${name}</li>`).join("");
        emailContent += "</ul>";
      }
  
      const emailBody = PDFEmailTemplate({
        quizTitle: "New PDFs Added",
        quizDescription: emailContent,
        questionCount: pdfs.length,
        subject: "New PDFs Available",
      });
  
      await sendBrevoEmail(recipients, "New PDFs Available", emailBody);
      
      console.log("Email notification sent successfully");
      return { success: true };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false };
    }
  };
  
  

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (let i = 0; i < pdfs.length; i++) {
        const pdf = pdfs[i];
  
        if (!pdf.pdfName || !pdf.pdfFile || pdf.playlists.length === 0) {
          alert("Please select a PDF file and choose at least one playlist.");
          return;
        }
        if (pdf.pdfFile.size > 100 * 1024 * 1024) { 
          alert(`File "${pdf.pdfName}" exceeds the 100 MB size limit.`);
          continue; 
        }
        console.log(`Uploading ${i + 1}/${pdfs.length}: ${pdf.pdfName}`);
        const pdfUrl = await uploadToCloudinary(pdf.pdfFile);
  
        if (!pdfUrl) {
          alert(`Failed to upload "${pdf.pdfName}". Please try again.`);
          continue;
        }
  
        console.log("Upload successful. pdfUrl:", pdfUrl);
        
        

        const pdfThumbnail = pdfUrl.replace("/upload/", "/upload/w_200,h_300,pg_1/"); 
  
        const pdfRef = await addDoc(collection(db, "pdfs"), {
          pdfName: pdf.pdfName,
          pdfLink: pdfUrl,
          pdfThumbnail: pdfThumbnail,
          type: pdf.type,
          createdAt: new Date(),
          readBy: [],
        });
  
        for (const playlistId of pdf.playlists) {
          const playlistRef = doc(db, "playlists", playlistId);
          await updateDoc(playlistRef, {
            pdfs: arrayUnion(pdfRef.id),
            updatedAt: new Date(),
          });
        }
      }
  
      alert("All PDFs added successfully!");
      sendPdfNotification().then(result => {
        if (!result.success) {
          console.warn("Email notification failed");
        }
        else{
          console.log("Email notification sent successfully");
        }
      });
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
    finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <LoadingScreen message="Submitting PDFs..." />;
  }
  return (
    <div className="qnm-question-container">
      <h2>Add PDFs</h2>
      {pdfs.map((pdf, index) => (
        <div key={index} className="qnm-question-block">
          <div className="qnm-form-group">
            <label>PDF File:</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(index, e.target.files[0])}
            />
          </div>

          <div className="qnm-form-group">
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
            <div className="qnm-pdf-thumbnail">
              <img src={pdf.pdfThumbnail} alt="PDF Preview" />
            </div>
          )}

          <div className="qnm-form-group">
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

          <div className="qnm-form-group">
            <label>Playlists:</label>
            <div className="qnm-playlist-cards">
              {allPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`qnm-playlist-card ${pdf.playlists.includes(playlist.id) ? "selected" : ""}`}
                  onClick={() => handlePlaylistSelection(index, playlist.id)}
                >
                  {playlist.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="qnm-action-buttons">
        <button onClick={handleAddPdf} className="qnm-add-question-btn">
          Add Another PDF
        </button>
        <button onClick={handleSubmit} className="qnm-submit-btnn">
          Post PDFs
        </button>
      </div>
    </div>
  );
};

export default AdminCAMaker;
