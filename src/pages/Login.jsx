import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    setLoading(true);

    try {
      // Ajout de logs pour déboguer
      console.log("Tentative de connexion avec:", formData);
      
      const response = await axios.post("/api/login", formData);
      console.log("Réponse du serveur:", response.data);
      
      // Stocker le token dans le localStorage
      localStorage.setItem("token", response.data.token);
      
      // Forcer un rechargement de la page après la connexion
      // Cela peut aider si la redirection ne fonctionne pas
      window.location.href = "/";
      
      // La ligne ci-dessous ne sera pas exécutée si window.location.href est utilisé
      // navigate("/");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setError(
        error.response?.data?.message || 
        "Une erreur s'est produite lors de la connexion"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Connexion</h1>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            Vous n'avez pas de compte ?{" "}
            <Link to="/register">Inscrivez-vous</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;