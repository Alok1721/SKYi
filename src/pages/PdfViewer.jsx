import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/pdfViewer.css";

const PdfViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const { pdfUrl, pdfName } = location.state || {};
  const [loading, setLoading] = useState(true);

  if (!pdfUrl) {
    return <p className="no-pdf-message">No PDF URL provided.</p>;
  }

  const handleFullscreen = () => {
    if (iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-viewer-header">
        <div className="left-actions">
          <button onClick={() => navigate(-1)} className="back-button">← Back</button>
          <h2 className="pdf-title">{pdfName}</h2>
        </div>
        <div className="right-actions">
          <a href={pdfUrl} download className="pdf-action-button">Download</a>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-action-button">Open in Tab</a>
          <button onClick={handleFullscreen} className="pdf-action-button">Fullscreen</button>
        </div>
      </div>

      {loading && <div className="loading-overlay">Loading PDF...</div>}

      <div className="iframe-container">
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          title="PDF Viewer"
          className="pdf-iframe"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default PdfViewer;
