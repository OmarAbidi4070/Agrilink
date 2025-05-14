import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import "./Messages.css"

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Récupérer l'ID de l'utilisateur connecté
  const currentUserId = localStorage.getItem('userId');

  // Récupérer les conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/conversations');
      setConversations(response.data);
      setLoading(false);
      
      // Si aucune conversation n'est sélectionnée et qu'il y a des conversations, sélectionner la première
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0]);
        fetchMessages(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Impossible de charger vos conversations. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Récupérer les messages d'une conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/messages/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Impossible de charger les messages. Veuillez réessayer.');
    }
  };

  // Envoyer un nouveau message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setSendingMessage(true);
      
      const response = await api.post('/messages', {
        conversationId: selectedConversation._id,
        content: newMessage
      });
      
      // Ajouter le nouveau message à la liste
      setMessages([...messages, response.data]);
      
      // Mettre à jour la dernière conversation avec le nouveau message
      const updatedConversations = conversations.map(conv => {
        if (conv._id === selectedConversation._id) {
          return {
            ...conv,
            lastMessage: response.data,
            updatedAt: new Date().toISOString()
          };
        }
        return conv;
      });
      
      // Trier les conversations par date de mise à jour
      updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      setConversations(updatedConversations);
      setNewMessage('');
      setSendingMessage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Impossible d\'envoyer le message. Veuillez réessayer.');
      setSendingMessage(false);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return format(date, 'dd MMM', { locale: fr });
    }
  };

  // Charger les conversations au chargement du composant
  useEffect(() => {
    fetchConversations();
    
    // Rafraîchir les conversations toutes les 30 secondes
    const intervalId = setInterval(fetchConversations, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Charger les messages lorsqu'une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  return (
    <div className="messages-container">
      <h1>Messages</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="messages-layout">
        {/* Liste des conversations */}
        <div className="conversations-list">
          <h2>Conversations</h2>
          
          {loading ? (
            <div className="loading">Chargement des conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <p>Vous n'avez pas encore de conversations.</p>
              <Link to="/map" className="btn btn-primary">
                Trouver des agriculteurs
              </Link>
            </div>
          ) : (
            <ul>
              {conversations.map(conversation => (
                <li 
                  key={conversation._id}
                  className={`conversation-item ${selectedConversation && selectedConversation._id === conversation._id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    fetchMessages(conversation._id);
                  }}
                >
                  <div className="conversation-avatar">
                    {conversation.recipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h3>{conversation.recipient.name}</h3>
                      <span className="conversation-time">
                        {conversation.lastMessage ? formatDate(conversation.updatedAt) : formatDate(conversation.createdAt)}
                      </span>
                    </div>
                    <p className="conversation-preview">
                      {conversation.lastMessage ? (
                        conversation.lastMessage.sender === currentUserId ? 
                        `Vous: ${conversation.lastMessage.content}` : 
                        conversation.lastMessage.content
                      ) : (
                        'Nouvelle conversation'
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Zone de messages */}
        <div className="messages-area">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <h2>{selectedConversation.recipient.name}</h2>
              </div>
              
              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>Aucun message. Commencez la conversation !</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message._id}
                      className={`message ${message.sender === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">{formatDate(message.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
              
              <form className="message-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={sendingMessage}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? 'Envoi...' : 'Envoyer'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>Sélectionnez une conversation ou commencez-en une nouvelle.</p>
              <Link to="/map" className="btn btn-primary">
                Trouver des agriculteurs
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;