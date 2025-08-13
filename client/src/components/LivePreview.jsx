const LivePreview = ({ welcomeMessage, description, textColor, backgroundImage, showLogo = true, buttonColor = '#17c4c4', buttonTextColor = '#fff' }) => {
  const bgSrc = backgroundImage || '/images/changihome.jpg';

  return (
    <div
      className="home-container"
      style={{
        width: 300,
        height: 340,
        borderRadius: 16,
        position: 'relative',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic background */}
      <img
        src={bgSrc}
        alt="Background"
        className="home-background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />
      <div
        className="home-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.65)',
          zIndex: 1,
        }}
      />

      {/* Disclaimer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontSize: 15,
        color: '#333',
        background: 'rgba(255,255,255,0.85)',
        zIndex: 10,
        padding: '8px 0',
        fontWeight: '500',
        letterSpacing: '0.2px',
      }}>
        <span>Preview may not be fully accurate (positions/layout may differ)</span>
      </div>

      {showLogo && (
        <div className="top-left-logo" style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
          <img src="/images/ces.jpg" alt="Changi Experience Studio" style={{ height: 40, width: 'auto' }} />
        </div>
      )}

      <div className="home-content" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1rem', boxSizing: 'border-box' }}>
        <div className="title-block" style={{ marginTop: '60px', textAlign: 'center' }}>
          <h1 style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginBottom: '0.5rem' }}>{welcomeMessage}</h1>
          <p style={{ color: textColor, fontSize: 12, marginTop: '12px', textAlign: 'center' }}>{description}</p>
        </div>
        <div className="description-block" style={{ marginTop: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="home-buttons">
            <button
              style={{
                background: buttonColor,
                color: buttonTextColor,
                padding: '10px 32px',
                fontSize: 14,
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                width: 120,
                marginBottom: 12,
              }}
            >
              Play
            </button>
            <button
              style={{
                background: buttonColor,
                color: buttonTextColor,
                padding: '10px 32px',
                fontSize: 14,
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                width: 120,
              }}
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;