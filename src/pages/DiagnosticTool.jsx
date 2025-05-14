import React, { useState, useRef } from 'react';
import api from '../services/api';
import "./DiagnosticTool.css"


const DiagnosticTool = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Gérer le téléchargement d'image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Veuillez sélectionner une image valide.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('L\'image est trop volumineuse. Taille maximale: 5MB.');
      return;
    }
    
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setDiagnosis(null);
    setIsShared(false);
  };

  // Démarrer la capture de la caméra
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
      setIsCapturing(false);
    }
  };

  // Arrêter la capture de la caméra
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  };

  // Capturer une image de la caméra
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Définir les dimensions du canvas pour correspondre à la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image de la vidéo sur le canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir le canvas en blob
    canvas.toBlob(blob => {
      if (blob) {
        // Créer un fichier à partir du blob
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        
        setImage(file);
        setImagePreview(URL.createObjectURL(blob));
        setError(null);
        setDiagnosis(null);
        setIsShared(false);
        
        // Arrêter la caméra
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  // Réinitialiser l'image
  const resetImage = () => {
    setImage(null);
    setImagePreview(null);
    setDiagnosis(null);
    setError(null);
    setIsShared(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Diagnostiquer l'image
  const handleDiagnose = async () => {
    if (!image) {
      setError('Veuillez d\'abord télécharger ou capturer une image.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('image', image);
    
    try {
      const response = await api.post('/diagnose', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setDiagnosis(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError('Une erreur s\'est produite lors du diagnostic. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Partager le diagnostic
  const handleShare = async () => {
    if (!diagnosis || !diagnosis._id) {
      setError('Aucun diagnostic à partager.');
      return;
    }
    
    try {
      setLoading(true);
      
      await api.post('/share-diagnosis', {
        diagnosisId: diagnosis._id
      });
      
      setIsShared(true);
      setLoading(false);
    } catch (err) {
      console.error('Share error:', err);
      setError('Une erreur s\'est produite lors du partage. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="diagnostic-tool-container">
      <h1>Outil de Diagnostic des Plantes</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="diagnostic-sections">
        {/* Section de téléchargement/capture d'image */}
        <div className="image-section">
          <h2>Image de la Plante</h2>
          
          {!imagePreview ? (
            <div className="upload-container">
              <div className="upload-methods">
                <div className="upload-method">
                  <h3>Télécharger une image</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="file-input"
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Sélectionner une image
                  </button>
                </div>
                
                <div className="upload-method">
                  <h3>Prendre une photo</h3>
                  {!isCapturing ? (
                    <button 
                      className="btn btn-secondary"
                      onClick={startCamera}
                    >
                      Activer la caméra
                    </button>
                  ) : (
                    <div className="camera-container">
                      <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="camera-preview"
                      />
                      <div className="camera-controls">
                        <button 
                          className="btn btn-primary"
                          onClick={captureImage}
                        >
                          Capturer
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={stopCamera}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <div className="upload-instructions">
                <p>Prenez une photo claire de la plante malade, en vous concentrant sur les zones affectées.</p>
                <p>Pour de meilleurs résultats:</p>
                <ul>
                  <li>Assurez-vous que l'image est bien éclairée</li>
                  <li>Évitez les ombres importantes</li>
                  <li>Capturez les symptômes visibles (taches, décolorations, etc.)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="image-preview-container">
              <img 
                src={imagePreview || "/placeholder.svg"} 
                alt="Aperçu de la plante" 
                className="image-preview" 
              />
              
              <div className="image-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={resetImage}
                >
                  Changer d'image
                </button>
                
                <button 
                  className="btn btn-primary"
                  onClick={handleDiagnose}
                  disabled={loading}
                >
                  {loading && !diagnosis ? 'Analyse en cours...' : 'Diagnostiquer'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Section de résultats */}
        {diagnosis && (
          <div className="results-section">
            <h2>Résultats du Diagnostic</h2>
            
            <div className="diagnosis-result">
              <div className="diagnosis-header">
                <h3>{diagnosis.diseaseName}</h3>
                <div className="confidence-badge">
                  Confiance: {diagnosis.confidence}%
                </div>
              </div>
              
              <div className="diagnosis-details">
                <div className="diagnosis-section">
                  <h4>Description</h4>
                  <p>{diagnosis.description}</p>
                </div>
                
                <div className="diagnosis-section">
                  <h4>Traitement recommandé</h4>
                  <p>{diagnosis.treatment}</p>
                </div>
              </div>
              
              <div className="diagnosis-actions">
                {!isShared ? (
                  <button 
                    className="btn btn-primary"
                    onClick={handleShare}
                    disabled={loading}
                  >
                    {loading ? 'Partage en cours...' : 'Partager avec la communauté'}
                  </button>
                ) : (
                  <div className="shared-badge">
                    ✓ Partagé avec la communauté
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticTool;