import { useState, useEffect } from "react";
import axios from "axios";
import { User, MapPin, Briefcase, Award } from "react-feather";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    crops: "",
    expertise: "",
    equipment: "",
    experience: "",
    latitude: "",
    longitude: ""
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Vous devez être connecté pour accéder à cette page");
        setLoading(false);
        return;
      }
      
      const response = await axios.get("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data);
      
      // Préparer les données du formulaire
      setFormData({
        name: response.data.name || "",
        crops: response.data.crops ? response.data.crops.join(", ") : "",
        expertise: response.data.expertise || "",
        equipment: response.data.equipment ? response.data.equipment.join(", ") : "",
        experience: response.data.experience || "",
        latitude: response.data.location?.coordinates[1] || "",
        longitude: response.data.location?.coordinates[0] || ""
      });
      
      setLoading(false);
    } catch (error) {
      setError("Erreur lors du chargement du profil");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    
    try {
      const token = localStorage.getItem("token");
      
      // Préparer les données pour l'API
      const userData = {
        name: formData.name,
        crops: formData.crops.split(',').map(crop => crop.trim()),
        expertise: formData.expertise,
        equipment: formData.equipment.split(',').map(item => item.trim()),
        experience: parseInt(formData.experience) || 0
      };
      
      // Ajouter les coordonnées si elles sont fournies
      if (formData.latitude && formData.longitude) {
        userData.latitude = parseFloat(formData.latitude);
        userData.longitude = parseFloat(formData.longitude);
      }
      
      const response = await axios.put("/api/profile", userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data);
      setIsEditing(false);
      setUpdateSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      setError("Erreur lors de la mise à jour du profil");
    }
  };

  // Obtenir la position actuelle de l'utilisateur
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          setError("Impossible d'obtenir votre position. Veuillez entrer manuellement vos coordonnées.");
        }
      );
    } else {
      setError("La géolocalisation n'est pas prise en charge par votre navigateur.");
    }
  };

  if (loading) {
    return <div className="loading">Chargement du profil...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <h1>{user.name}</h1>
          
          {!isEditing && (
            <button 
              className="btn btn-secondary edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Modifier le profil
            </button>
          )}
        </div>
        
        {updateSuccess && (
          <div className="alert alert-success">
            Profil mis à jour avec succès!
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-section">
              <h2>Informations personnelles</h2>
              
              <div className="form-group">
                <label htmlFor="name">Nom complet</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-section">
              <h2>Localisation</h2>
              
              <div className="location-fields">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    className="form-control"
                    value={formData.latitude}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    className="form-control"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={getCurrentLocation}
              >
                Mettre à jour ma position
              </button>
            </div>
            
            <div className="form-section">
              <h2>Profil agricole</h2>
              
              <div className="form-group">
                <label htmlFor="crops">Cultures (séparées par des virgules)</label>
                <input
                  type="text"
                  id="crops"
                  name="crops"
                  className="form-control"
                  value={formData.crops}
                  onChange={handleChange}
                  placeholder="Ex: tomates, blé, maïs"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="expertise">Expertise</label>
                <select
                  id="expertise"
                  name="expertise"
                  className="form-control"
                  value={formData.expertise}
                  onChange={handleChange}
                >
                  <option value="">Sélectionnez votre expertise</option>
                  <option value="bio">Agriculture biologique</option>
                  <option value="conventionnel">Agriculture conventionnelle</option>
                  <option value="permaculture">Permaculture</option>
                  <option value="hydroponie">Hydroponie</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="equipment">Équipement (séparé par des virgules)</label>
                <input
                  type="text"
                  id="equipment"
                  name="equipment"
                  className="form-control"
                  value={formData.equipment}
                  onChange={handleChange}
                  placeholder="Ex: tracteur, moissonneuse, système d'irrigation"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="experience">Années d'expérience</label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  className="form-control"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Annuler
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-section">
              <div className="info-header">
                <MapPin size={20} />
                <h2>Localisation</h2>
              </div>
              
              <div className="info-content">
                {user.location?.coordinates ? (
                  <p>
                    Latitude: {user.location.coordinates[1]}<br />
                    Longitude: {user.location.coordinates[0]}
                  </p>
                ) : (
                  <p className="no-data">Aucune localisation enregistrée</p>
                )}
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-header">
                <Briefcase size={20} />
                <h2>Cultures</h2>
              </div>
              
              <div className="info-content">
                {user.crops && user.crops.length > 0 ? (
                  <div className="tags">
                    {user.crops.map((crop, index) => (
                      <span key={index} className="tag">{crop}</span>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucune culture enregistrée</p>
                )}
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-header">
                <Award size={20} />
                <h2>Expertise et Expérience</h2>
              </div>
              
              <div className="info-content">
                {user.expertise ? (
                  <p><strong>Expertise:</strong> {user.expertise}</p>
                ) : (
                  <p className="no-data">Aucune expertise enregistrée</p>
                )}
                
                {user.experience ? (
                  <p><strong>Expérience:</strong> {user.experience} années</p>
                ) : (
                  <p className="no-data">Aucune expérience enregistrée</p>
                )}
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-header">
                <Briefcase size={20} />
                <h2>Équipement</h2>
              </div>
              
              <div className="info-content">
                {user.equipment && user.equipment.length > 0 ? (
                  <div className="tags">
                    {user.equipment.map((item, index) => (
                      <span key={index} className="tag">{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucun équipement enregistré</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;