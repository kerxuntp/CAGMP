import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from './AlertModal';
import Loading from './Loading';
import '../styles/pages/Questions.css';
import '../styles/global/MainStyles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CollectionsBank = () => {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('latest'); // Default to Latest First

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setModalTitle('Not Logged In');
      setModalMessage('You must be logged in to access this page.');
      setShowErrorModal(true);
    }
  }, [navigate]);

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/collections/`);
        const data = await res.json();
        // Sort collections based on sortOption
        const sortedData = Array.isArray(data)
          ? data.sort((a, b) => {
              if (sortOption === 'latest') {
                return new Date(b.createdAt) - new Date(a.createdAt); // Latest first
              } else if (sortOption === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
              } else if (sortOption === 'a-z') {
                return a.name.localeCompare(b.name); // A-Z
              } else if (sortOption === 'z-a') {
                return b.name.localeCompare(a.name); // Z-A
              }
              return 0;
            })
          : [];
        // Fetch question count for each collection in parallel
        const withCounts = await Promise.all(
          sortedData.map(async (col) => {
            try {
              const countRes = await fetch(`${API_BASE_URL}/collections/${col._id}/question-count`);
              if (countRes.ok) {
                const countData = await countRes.json();
                return { ...col, questionCount: countData.questionCount };
              }
            } catch {}
            return { ...col, questionCount: 0 };
          })
        );
        setCollections(withCounts);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollections();
  }, [sortOption]);

  // Delete logic
  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections/${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCollections((prev) => prev.filter((col) => col._id !== deleteTargetId));
        setModalTitle('Deleted');
        setModalMessage('Collection deleted successfully. Questions remain in the database.');
        setShowSuccessModal(true);
      } else {
        const data = await res.json();
        setModalTitle('Error');
        setModalMessage(data.message || 'Failed to delete the collection.');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error deleting collection:', err);
      setModalTitle('Server Error');
      setModalMessage('Error deleting collection.');
      setShowErrorModal(true);
    }
    setShowConfirmModal(false);
    setDeleteTargetId(null);
  };

  // Handlers
  const handleEdit = (id) => {
    navigate(`/get-collections/${id}`, {
      state: { from: 'collections' },
    });
  };

  const handleDeleteClick = (id, isPublic, name, isOnline) => {
    if (isPublic && isOnline) {
      setModalTitle('Cannot Delete Online Public Collection');
      setModalMessage(
        `The collection "${name}" is public and online. Please set its online status to offline in Edit Collection before deleting.`
      );
      setDeleteTargetId(id);
      setShowConfirmModal(true);
      return;
    }
    setDeleteTargetId(id);
    setModalTitle('Confirm Delete');
    setModalMessage(
      `Are you sure you want to delete "${name}"? Players data will be lost but Questions will be preserved`
    );
    setShowConfirmModal(true);
  };

  const handleModalClose = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setDeleteTargetId(null);
    if (modalTitle === 'Not Logged In') {
      navigate('/login');
    }
  };

  const handleConfirmAction = () => {
    if (modalTitle === 'Cannot Delete Online Public Collection') {
      handleModalClose();
      navigate(`/edit-collection/${deleteTargetId}`);
    } else {
      confirmDelete();
    }
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay" />
      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="Changi Experience Studio" />
      </div>

      <div className="scroll-wrapper">
        <div className="buttons" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h1 style={{ color: '#000', fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>
            Collections Bank
          </h1>

          {/* Sort Dropdown */}
          <div style={{ alignSelf: 'flex-end', marginBottom: '8px' }}>
            <select
              value={sortOption}
              onChange={handleSortChange}
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
            </select>
          </div>

          <div style={{ maxHeight: '65vh', overflowY: 'auto', width: '100%' }}>
            {isLoading ? (
              <Loading />
            ) : collections.length === 0 ? (
              <p>No collections found.</p>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {collections.map((col) => (
                  <li
                    key={col._id}
                    onClick={() =>
                      navigate(`/get-collections/${col._id}`, {
                        state: { from: 'collections' },
                      })
                    }
                    style={{
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>
                        {col.name}{' '}
                        {col.isPublic && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#fff',
                              backgroundColor: '#28a745',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              marginLeft: '4px',
                            }}
                          >
                            Public
                          </span>
                        )}{' '}
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#fff',
                            backgroundColor: col.isOnline ? '#17C4C4' : '#DC3545',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginLeft: '4px',
                          }}
                        >
                          {col.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </strong>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          backgroundColor: '#f0f0f0',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        Code: {col.isPublic ? 'N/A' : col.code}
                      </span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {typeof col.questionCount === 'number' ? col.questionCount : 0} Questions
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="login-btn"
                        style={{ backgroundColor: '#FFC107', color: '#000', fontSize: '14px', padding: '5px 10px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(col._id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="login-btn"
                        style={{ backgroundColor: '#DC3545', color: '#fff', fontSize: '14px', padding: '5px 10px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(col._id, col.isPublic, col.name, col.isOnline);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => navigate('/add-collection')}
              className="login-btn"
              style={{ backgroundColor: '#28a745', color: '#000' }}
            >
              Add New Collection
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="login-btn"
              style={{ backgroundColor: '#17C4C4', color: '#000' }}
            >
              Return
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete */}
      <AlertModal
        isOpen={showConfirmModal}
        onClose={handleModalClose}
        onConfirm={handleConfirmAction}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalTitle === 'Cannot Delete Online Public Collection' ? 'Edit Collection' : 'Delete'}
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />

      {/* Success */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />

      {/* Error */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="error"
        showCancel={false}
      />
    </div>
  );
};

export default CollectionsBank;