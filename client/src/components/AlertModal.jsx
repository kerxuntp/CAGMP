import React from 'react';
import '../styles/global/MainStyles.css';

const AlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info", // "info", "success", "warning", "error"
  icon = null,
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          borderColor: '#4CAF50',
          iconColor: '#4CAF50',
          confirmBg: 'linear-gradient(135deg, #4CAF50, #45a049)'
        };
      case 'warning':
        return {
          borderColor: '#ff9800',
          iconColor: '#ff9800',
          confirmBg: 'linear-gradient(135deg, #ff9800, #f57c00)'
        };
      case 'error':
        return {
          borderColor: '#f44336',
          iconColor: '#f44336',
          confirmBg: 'linear-gradient(135deg, #f44336, #d32f2f)'
        };
      default:
        return {
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          confirmBg: 'linear-gradient(135deg, #2196F3, #1976D2)'
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getDefaultIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  };

  const modalContentStyle = {
    background: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s ease-out',
    borderTop: `4px solid ${typeStyles.borderColor}`
  };

  const modalHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 25px 15px',
    borderBottom: '1px solid #f0f0f0'
  };

  const modalIconStyle = {
    fontSize: '24px',
    lineHeight: 1,
    color: typeStyles.iconColor
  };

  const modalTitleStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#333'
  };

  const modalBodyStyle = {
    padding: '15px 25px 20px'
  };

  const modalBodyTextStyle = {
    margin: 0,
    fontSize: '16px',
    lineHeight: 1.5,
    color: '#555'
  };

  const modalActionsStyle = {
    display: 'flex',
    gap: '10px',
    padding: '15px 25px 25px',
    justifyContent: 'flex-end'
  };

  const cancelButtonStyle = {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    background: '#f5f5f5',
    color: '#666'
  };

  const cancelButtonHoverStyle = {
    background: '#e8e8e8',
    borderColor: '#ccc'
  };

  const confirmButtonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    color: 'white',
    background: typeStyles.confirmBg
  };

  const confirmButtonHoverStyle = {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
  };

  return (
    <div style={modalOverlayStyle} onClick={handleCancel}>
      <div
        style={modalContentStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div style={modalIconStyle}>
            {icon || getDefaultIcon()}
          </div>
          <h3 style={modalTitleStyle}>{title}</h3>
        </div>

        <div style={modalBodyStyle}>
          <p style={modalBodyTextStyle}>{message}</p>
        </div>

        <div style={modalActionsStyle}>
          {showCancel && (
            <button
              style={cancelButtonStyle}
              onClick={handleCancel}
              onMouseOver={(e) => {
                e.currentTarget.style.background = cancelButtonHoverStyle.background;
                e.currentTarget.style.borderColor = cancelButtonHoverStyle.borderColor;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = cancelButtonStyle.background;
                e.currentTarget.style.borderColor = cancelButtonStyle.border;
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            style={confirmButtonStyle}
            onClick={handleConfirm}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = confirmButtonHoverStyle.transform;
              e.currentTarget.style.boxShadow = confirmButtonHoverStyle.boxShadow;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;