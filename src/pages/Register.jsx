import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    latitude: "",
    longitude: "",
    crops: "",
    expertise: "",
    equipment: "",
    experience: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    setLoading(true);

    try {
      // Préparer les données pour l'API
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        crops: formData.crops.split(',').map(crop => crop.trim()),
        expertise: formData.expertise,
        equipment: formData.equipment.split(',').map(item => item.trim()),
        experience: parseInt(formData.experience) || 0
      };
      
      const response = await axios.post("/api/register", userData);
      
      // Stocker le token dans le localStorage
      localStorage.setItem("token", response.data.token);
      
      // Rediriger vers la page d'accueil
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Une erreur s'est produite lors de l'inscription"
      );
    } finally {
      setLoading(false);
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

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>Inscription</h1>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h2>Localisation</h2>
            <p className="form-help">
              Nous avons besoin de votre position pour vous connecter avec des agriculteurs proches.
            </p>
            
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
                  required
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
                  required
                />
              </div>
            </div>
            
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={getCurrentLocation}
            >
              Utiliser ma position actuelle
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
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>
        
        <div className="register-footer">
          <p>
            Vous avez déjà un compte ?{" "}
            <Link to="/login">Connectez-vous</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;