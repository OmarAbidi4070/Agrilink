import { useState, useEffect } from "react";
import axios from "axios";
import { User, Calendar, Filter } from "react-feather";
import "./Community.css";

const Community = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [userCrops, setUserCrops] = useState([]);

  useEffect(() => {
    fetchUserProfile();
    fetchDiagnoses();
  }, []);

  useEffect(() => {
    fetchDiagnoses(filter);
  }, [filter]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        return;
      }
      
      const response = await axios.get("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.crops) {
        setUserCrops(response.data.crops);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    }
  };

  const fetchDiagnoses = async (cropFilter = "") => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Vous devez être connecté pour accéder à cette page");
        setLoading(false);
        return;
      }
      
      const params = {};
      if (cropFilter) {
        params.crop = cropFilter;
      }
      
      const response = await axios.get("/api/community-diagnoses", {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });
      
      setDiagnoses(response.data);
      setLoading(false);
    } catch (error) {
      setError("Erreur lors du chargement des diagnostics communautaires");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return <div className="loading">Chargement des diagnostics communautaires...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="community-page">
      <div className="community-header">
        <h1>Diagnostics partagés par la communauté</h1>
        <p>
          Découvrez les diagnostics de maladies végétales partagés par d'autres agriculteurs et apprenez des expériences de la communauté.
        </p>
      </div>
      
      <div className="filter-section">
        <div className="filter-header">
          <Filter size={18} />
          <h2>Filtrer par culture</h2>
        </div>
        
        <div className="filter-options">
          <button 
            className={`filter-btn ${filter === "" ? "active" : ""}`}
            onClick={() => setFilter("")}
          >
            Toutes
          </button>
          
          {userCrops.map((crop, index) => (
            <button 
              key={index}
              className={`filter-btn ${filter === crop ? "active" : ""}`}
              onClick={() => setFilter(crop)}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>
      
      {diagnoses.length === 0 ? (
        <div className="no-diagnoses">
          <p>Aucun diagnostic partagé pour le moment.</p>
          <p>Soyez le premier à partager un diagnostic avec la communauté!</p>
        </div>
      ) : (
        <div className="diagnoses-list">
          {diagnoses.map((diagnosis) => (
            <div key={diagnosis._id} className="diagnosis-card">
              <div className="diagnosis-header">
                <div className="user-info">
                  <div className="user-avatar">
                    <User size={18} />
                  </div>
                  <span className="user-name">{diagnosis.user.name}</span>
                </div>
                
                <div className="diagnosis-date">
                  <Calendar size={14} />
                  <span>{formatDate(diagnosis.createdAt)}</span>
                </div>
              </div>
              
              <div className="diagnosis-content">
                <h3>{diagnosis.disease.name}</h3>
                
                <div className="diagnosis-image">
                  <img src={`/${diagnosis.image.replace(/\\/g, '/')}`} alt="Image de la maladie" />
                </div>
                
                <div className="diagnosis-details">
                  <p className="confidence">
                    <strong>Confiance:</strong> {diagnosis.confidence}%
                  </p>
                  
                  <p className="description">
                    <strong>Description:</strong> {diagnosis.disease.description}
                  </p>
                  
                  <p className="treatment">
                    <strong>Traitement recommandé:</strong> {diagnosis.disease.treatment}
                  </p>
                  
                  <div className="affected-crops">
                    <strong>Cultures affectées:</strong>
                    <div className="crops-tags">
                      {diagnosis.disease.affectedCrops.map((crop, index) => (
                        <span key={index} className="crop-tag">{crop}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;