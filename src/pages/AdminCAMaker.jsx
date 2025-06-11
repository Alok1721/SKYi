import React, { useEffect, useState } from "react";
import "../styles/adminCAMaker.css";
import { db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, doc, arrayUnion, getDocs, query, where } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";
import { sendBrevoEmail } from "../emailServices/emailFunctions";
import { getSubscribedUsers } from "../firebaseServices/firestoreUtils";
import { PDFEmailTemplate } from "../emailServices/emailTemplates";
import { getAdminDefaultExam } from "../firebaseServices/admin_service";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

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
  const [examName, setExamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([{}]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch default examName
        const defaultExam = await getAdminDefaultExam();
        setExamName(defaultExam);
        // Fetch playlists filtered by examName
        const playlistsQuery = defaultExam
          ? query(collection(db, "playlists"), where("examName", "==", defaultExam))
          : collection(db, "playlists");
        const querySnapshot = await getDocs(playlistsQuery);
        const playlistData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setAllPlaylists(playlistData);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (index, file) => {
    const newPdfs = [...pdfs];
    newPdfs[index].pdfFile = file;
    newPdfs[index].pdfName = file.name;
    setPdfs(newPdfs);
    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], pdfFile: "" };
    setErrors(newErrors);
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
    setErrors([...errors, {}]);
  };

  const handleChange = (index, field, value) => {
    const newPdfs = [...pdfs];
    newPdfs[index][field] = value;
    setPdfs(newPdfs);
    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], [field]: "" };
    setErrors(newErrors);
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
    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], playlists: "" };
    setErrors(newErrors);
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
        subject: `New ${examName} PDFs Available`,
      });

      await sendBrevoEmail(recipients, `New ${examName} PDFs Available`, emailBody);
      console.log("Email notification sent successfully");
      return { success: true };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false };
    }
  };

  const handleSubmit = async () => {
    if (!examName) {
      alert("Please select a default exam in Settings.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const newErrors = pdfs.map(() => ({}));
    let hasErrors = false;

    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      if (!pdf.pdfName) {
        newErrors[i].pdfName = "PDF name is required.";
        hasErrors = true;
      }
      if (!pdf.pdfFile) {
        newErrors[i].pdfFile = "Please select a PDF file.";
        hasErrors = true;
      }
      if (pdf.playlists.length === 0) {
        newErrors[i].playlists = "Please select at least one playlist.";
        hasErrors = true;
      }
      if (pdf.pdfFile && pdf.pdfFile.size > 100 * 1024 * 1024) {
        newErrors[i].pdfFile = `File "${pdf.pdfName}" exceeds the 100 MB size limit.`;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      for (let i = 0; i < pdfs.length; i++) {
        const pdf = pdfs[i];
        console.log(`Uploading ${i + 1}/${pdfs.length}: ${pdf.pdfName}`);
        const pdfUrl = await uploadToCloudinary(pdf.pdfFile);

        if (!pdfUrl) {
          newErrors[i].pdfFile = `Failed to upload "${pdf.pdfName}". Please try again.`;
          setErrors(newErrors);
          continue;
        }

        console.log("Upload successful. pdfUrl:", pdfUrl);
        const pdfThumbnail = pdfUrl.replace("/upload/", "/upload/w_200,h_300,pg_1/");

        const pdfRef = await addDoc(collection(db, "pdfs"), {
          pdfName: pdf.pdfName,
          pdfLink: pdfUrl,
          pdfThumbnail: pdfThumbnail,
          type: pdf.type,
          examName, // Include examName
          createdAt: new Date(),
          readBy: [],
        });

        for (const playlistId of pdf.playlists) {
          const playlistRef = doc(db, "playlists", playlistId);
          await updateDoc(playlistRef, {
            pdfs: arrayUnion(pdfRef.id),
            updatedAt: new Date(),
            examName, // Ensure playlist has examName
          });
        }
      }

      alert("All PDFs added successfully!");
      sendPdfNotification().then((result) => {
        if (!result.success) {
          console.warn("Email notification failed");
        } else {
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
      setErrors([{}]);
    } catch (error) {
      console.error("Error adding PDFs:", error);
      alert("An error occurred while adding PDFs. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <LoadingScreen message="Submitting PDFs..." />;
  }

  return (
    <div className="qnm-question-container">
      <h2>Add PDFs for {examName || "No Exam Selected"}</h2>
      <div className="qnm-question-wrapper">
        {pdfs.map((pdf, index) => (
          <div key={index} className="qnm-left-container">
            <div className="qnm-form-group">
              <label>PDF File:</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(index, e.target.files[0])}
              />
              {errors[index]?.pdfFile && (
                <span className="qnm-error-message">{errors[index].pdfFile}</span>
              )}
            </div>

            <div className="qnm-form-group">
              <label>PDF Name:</label>
              <input
                type="text"
                placeholder="Enter PDF Name"
                value={pdf.pdfName}
                onChange={(e) => handleChange(index, "pdfName", e.target.value)}
              />
              {errors[index]?.pdfName && (
                <span className="qnm-error-message">{errors[index].pdfName}</span>
              )}
            </div>

            {pdf.pdfThumbnail && (
              <div className="qnm-uploaded-image">
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

            <div className="qnm-playlist-group">
              <h4>Playlists:</h4>
              <div className="qnm-playlist-cards">
                {allPlaylists.length === 0 && <p>No playlists available for {examName}.</p>}
                {allPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`qnm-playlist-card ${pdf.playlists.includes(playlist.id) ? "selected" : ""}`}
                    onClick={() => handlePlaylistSelection(index, playlist.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select playlist ${playlist.name}`}
                  >
                    {playlist.name}
                  </div>
                ))}
              </div>
              {errors[index]?.playlists && (
                <span className="qnm-error-message">{errors[index].playlists}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="qnm-action-buttons">
        <button onClick={handleAddPdf} className="qnm-add-question-btn">
          Add Another PDF
        </button>
        <button onClick={handleSubmit} className="qnm-submit-btn">
          Post PDFs
        </button>
      </div>
    </div>
  );
};

export default AdminCAMaker;
