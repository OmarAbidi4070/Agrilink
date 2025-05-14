import { Link } from "react-router-dom"
import { Facebook, Twitter, Instagram, Mail } from "react-feather"
import "./Footer.css"

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <Link to="/">
            <img src="/images/logo.png" alt="AgriLink Logo" className="logo-image" />
            <span className="logo-text">AgriLink</span>
          </Link>
          <p className="footer-tagline">Connecter les agriculteurs, cultiver l'avenir</p>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h3>Navigation</h3>
            <ul>
              <li>
                <Link to="/">Accueil</Link>
              </li>
              <li>
                <Link to="/map">Carte</Link>
              </li>
              <li>
                <Link to="/diagnostic">Diagnostic</Link>
              </li>
              <li>
                <Link to="/community">Communauté</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Ressources</h3>
            <ul>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to="/support">Support</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Légal</h3>
            <ul>
              <li>
                <Link to="/terms">Conditions d'utilisation</Link>
              </li>
              <li>
                <Link to="/privacy">Politique de confidentialité</Link>
              </li>
              <li>
                <Link to="/cookies">Cookies</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-social">
          <h3>Suivez-nous</h3>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="mailto:contact@agrilink.com" aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AgriLink. Tous droits réservés.</p>
      </div>
    </footer>
  )
}

export default Footer
