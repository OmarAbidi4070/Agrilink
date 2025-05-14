import { Link } from "react-router-dom"
import "./Home.css"
import { MapPin, MessageCircle, Feather, Users } from "react-feather"
const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>AgriLink</h1>
          <h2>Plateforme d'entraide et de diagnostic pour agriculteurs</h2>
          <p>
            Connectez-vous avec d'autres agriculteurs, partagez vos connaissances et identifiez rapidement les maladies
            végétales
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              S'inscrire
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Se connecter
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="agric.jpeg" alt="Agriculteurs collaborant" />
        </div>
      </section>

      <section className="features">
        <h2>Fonctionnalités principales</h2>
        <div className="features-grid">
          <div className="feature-card">
            <MapPin size={48} className="feature-icon" />
            <h3>Carte interactive</h3>
            <p>Localisez les agriculteurs proches de vous et filtrez par type de culture</p>
          </div>
          <div className="feature-card">
            <MessageCircle size={48} className="feature-icon" />
            <h3>Messagerie</h3>
            <p>Communiquez directement avec d'autres agriculteurs pour demander ou proposer de l'aide</p>
          </div>
          <div className="feature-card">
          <Feather size={48} className="feature-icon" />
            <h3>Diagnostic de maladies</h3>
            <p>Identifiez rapidement les maladies végétales grâce à notre outil d'analyse d'image</p>
          </div>
          <div className="feature-card">
            <Users size={48} className="feature-icon" />
            <h3>Communauté</h3>
            <p>Partagez vos diagnostics et solutions avec la communauté agricole locale</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Prêt à rejoindre la communauté AgriLink?</h2>
        <Link to="/register" className="btn btn-primary">
          Commencer maintenant
        </Link>
      </section>
    </div>
  )
}

export default Home
