"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, User, Map, MessageSquare, Camera, Users, LogOut } from "react-feather"
import "./Navbar.css"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  // Mock authentication state - in a real app, this would come from your auth context
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("token") ? true : false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="agrilinklogo.png" alt="AgriLink Logo" className="logo-image" />
          <span className="logo-text">AgriLink</span>
        </Link>

        <div className="menu-icon" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>

        <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <User size={18} />
                  <span>Profil</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/map" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <Map size={18} />
                  <span>Carte</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/messages" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <MessageSquare size={18} />
                  <span>Messages</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/diagnostic" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <Camera size={18} />
                  <span>Diagnostic</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/community" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <Users size={18} />
                  <span>Communauté</span>
                </Link>
              </li>
              <li className="nav-item">
                <button className="nav-link logout-btn" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Connexion
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link register-btn" onClick={() => setIsMenuOpen(false)}>
                  Inscription
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
