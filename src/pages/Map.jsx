import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import "./Map.css"

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState([46.603354, 1.888334]); // Centre de la France par défaut
  const [filters, setFilters] = useState({
    cropType: '',
    expertise: '',
    equipment: '',
  });
  const mapRef = useRef(null);

  // Récupérer les agriculteurs
  const fetchFarmers = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/farmers', {
        params: filters,
      });
      
      setFarmers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setError('Impossible de charger les agriculteurs. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Récupérer la position de l'utilisateur
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          // Centrer la carte sur la position de l'utilisateur
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 10);
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  };

  // Gérer les changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Appliquer les filtres
  const applyFilters = (e) => {
    e.preventDefault();
    fetchFarmers();
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      cropType: '',
      expertise: '',
      equipment: '',
    });
    
    // Appliquer les filtres réinitialisés
    fetchFarmers();
  };

  // Démarrer une conversation avec un agriculteur
  const startConversation = async (farmerId) => {
    try {
      await api.post('/conversations', {
        recipient: farmerId
      });
      
      // Rediriger vers la page des messages
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Impossible de démarrer la conversation. Veuillez réessayer.');
    }
  };

  // Charger les agriculteurs au chargement du composant
  useEffect(() => {
    getUserLocation();
    fetchFarmers();
  }, []);

  return (
    <div className="map-container">
      <h1>Carte des Agriculteurs</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Filtres */}
      <div className="filters-container">
        <form onSubmit={applyFilters}>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="cropType">Type de culture</label>
              <select
                id="cropType"
                name="cropType"
                value={filters.cropType}
                onChange={handleFilterChange}
              >
                <option value="">Toutes les cultures</option>
                <option value="blé">Blé</option>
                <option value="maïs">Maïs</option>
                <option value="orge">Orge</option>
                <option value="colza">Colza</option>
                <option value="tournesol">Tournesol</option>
                <option value="vigne">Vigne</option>
                <option value="légumes">Légumes</option>
                <option value="fruits">Fruits</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="expertise">Expertise</label>
              <select
                id="expertise"
                name="expertise"
                value={filters.expertise}
                onChange={handleFilterChange}
              >
                <option value="">Toutes les expertises</option>
                <option value="bio">Agriculture biologique</option>
                <option value="conventionnel">Agriculture conventionnelle</option>
                <option value="raisonnée">Agriculture raisonnée</option>
                <option value="permaculture">Permaculture</option>
                <option value="agroforesterie">Agroforesterie</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="equipment">Équipement</label>
              <select
                id="equipment"
                name="equipment"
                value={filters.equipment}
                onChange={handleFilterChange}
              >
                <option value="">Tous les équipements</option>
                <option value="tracteur">Tracteur</option>
                <option value="moissonneuse">Moissonneuse-batteuse</option>
                <option value="semoir">Semoir</option>
                <option value="pulvérisateur">Pulvérisateur</option>
                <option value="irrigation">Système d'irrigation</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button type="submit" className="btn btn-primary">Appliquer</button>
              <button type="button" className="btn btn-secondary" onClick={resetFilters}>Réinitialiser</button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Carte */}
      <div className="map-wrapper">
        {loading ? (
          <div className="loading">Chargement de la carte...</div>
        ) : (
          <MapContainer
            center={userLocation}
            zoom={8}
            style={{ height: '600px', width: '100%' }}
            whenCreated={mapInstance => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Marqueur de l'utilisateur */}
            <Marker position={userLocation}>
              <Popup>
                <strong>Votre position</strong>
              </Popup>
            </Marker>
            
            {/* Marqueurs des agriculteurs */}
            {farmers.map(farmer => (
              <Marker
                key={farmer._id}
                position={[farmer.location.coordinates[1], farmer.location.coordinates[0]]}
              >
                <Popup>
                  <div className="farmer-popup">
                    <h3>{farmer.name}</h3>
                    
                    {farmer.crops && farmer.crops.length > 0 && (
                      <p><strong>Cultures:</strong> {farmer.crops.join(', ')}</p>
                    )}
                    
                    {farmer.expertise && (
                      <p><strong>Expertise:</strong> {farmer.expertise}</p>
                    )}
                    
                    {farmer.equipment && farmer.equipment.length > 0 && (
                      <p><strong>Équipement:</strong> {farmer.equipment.join(', ')}</p>
                    )}
                    
                    <div className="popup-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => startConversation(farmer._id)}
                      >
                        Contacter
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      
      {/* Résultats */}
      <div className="farmers-results">
        <h2>Agriculteurs ({farmers.length})</h2>
        
        {farmers.length === 0 ? (
          <div className="empty-state">
            <p>Aucun agriculteur trouvé avec ces critères.</p>
          </div>
        ) : (
          <div className="farmers-grid">
            {farmers.map(farmer => (
              <div key={farmer._id} className="farmer-card">
                <div className="farmer-avatar">
                  {farmer.name.charAt(0).toUpperCase()}
                </div>
                <div className="farmer-info">
                  <h3>{farmer.name}</h3>
                  
                  {farmer.crops && farmer.crops.length > 0 && (
                    <p><strong>Cultures:</strong> {farmer.crops.join(', ')}</p>
                  )}
                  
                  {farmer.expertise && (
                    <p><strong>Expertise:</strong> {farmer.expertise}</p>
                  )}
                  
                  {farmer.equipment && farmer.equipment.length > 0 && (
                    <p><strong>Équipement:</strong> {farmer.equipment.join(', ')}</p>
                  )}
                  
                  <button
                    className="btn btn-primary"
                    onClick={() => startConversation(farmer._id)}
                  >
                    Contacter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;