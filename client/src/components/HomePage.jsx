import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainStyles.css';

const HomePage = ({ previewData }) => {
  const navigate = useNavigate();
  const [customisation, setCustomisation] = useState(previewData || null);

  useEffect(() => {
    if (!previewData) fetchCustomisation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomisation = async () => {
    try {
      const response = await fetch('http://localhost:5000/landing-customisation');
      const data = await response.json();
      setCustomisation(data);
    } catch (error) {
      console.error('Error fetching customisation:', error);
    }
  };

  const handlePlayClick = () => {
    navigate('/getcode');
  };

  const handleAdminLoginClick = () => {
    navigate('/login');
  };

  const getBackgroundStyle = () => {
    if (!customisation) return {};

    switch (customisation.backgroundType) {
      case 'color':
        return { backgroundColor: customisation.backgroundColor };
      case 'gradient':
        { const gradientString = `linear-gradient(${customisation.gradientDirection}, ${customisation.gradientColors.join(', ')})`;
        return { background: gradientString }; }
      case 'image':
      default:
        { const imageUrl = customisation.backgroundImage.startsWith('/') 
          ? customisation.backgroundImage 
          : `http://localhost:5000/${customisation.backgroundImage}`;
        return { 
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }; }
    }
  };

  return (
    <div className="home-container">
      {/* Dynamic background */}
      {customisation?.backgroundType === 'image' ? (
        <img 
          src={customisation.backgroundImage.startsWith('/') 
            ? customisation.backgroundImage 
            : `http://localhost:5000/${customisation.backgroundImage}`} 
          alt="Background" 
          className="home-background" 
        />
      ) : (
        <div 
          className="home-background" 
          style={getBackgroundStyle()}
        />
      )}
      
      <div className="home-overlay"></div>

      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="Changi Experience Studio" />
      </div>

      <div className="home-content">
  <div className="title-block">
    <h1 style={{ color: customisation?.titleColor || '#000000' }}>
      {customisation?.welcomeMessage || 'Welcome To GoChangi!'}
    </h1>
    <p style={{ color: customisation?.descriptionColor || '#000000', marginTop: '12px', textAlign: 'center' }}>
      {customisation?.description || 'Discover Changi, One Clue at a Time!'}
    </p>
  </div>

  <div className="description-block">
    <div className="home-buttons">
      <button onClick={handlePlayClick}>Play</button>
      <button onClick={handleAdminLoginClick}>Admin Login</button>
    </div>
    <div className="jewel-logo-wrapper" style={{ marginTop: '20px' }}>
      <img src="/images/jewel.png" alt="Jewel Logo" />
    </div>
  </div>
</div>
    </div>
  );
};

export default HomePage;