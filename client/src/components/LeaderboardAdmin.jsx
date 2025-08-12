/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './MainStyles.css';
import './LeaderboardStyles.css';
import AlertModal from "./AlertModal";
import { ManualClearModal, AutoClearModal, AutoClearLogModal } from "./LeaderboardClearModals";
import Loading from "./Loading";

// Define filter options for the leaderboard (e.g., Today, This Week)
const FILTERS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

// Helper function to check if a date falls within a filter range (day, week, month, or all)
function isWithin(date, filter) {
  const now = new Date();
  const d = new Date(date);
  if (filter === "day") return d.toDateString() === now.toDateString();
  if (filter === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= now;
  }
  if (filter === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  return true;
}

export default function LeaderboardAdmin() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const navigate = useNavigate();

  // State for managing leaderboard data and UI
  const [players, setPlayers] = useState([]); // Stores player data
  const [collections, setCollections] = useState({}); // Maps collection IDs to names
  const [filter, setFilter] = useState("all"); // Time filter (day, week, month, all)
  const [selectedCollection, setSelectedCollection] = useState("all"); // Selected collection filter
  const [page, setPage] = useState(0); // Current page for pagination
  const [hoveredPlayerId, setHoveredPlayerId] = useState(null); // Tracks hovered player for tooltip
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [autoClearConfigs, setAutoClearConfigs] = useState({}); // Auto-clear settings per collection
  const [tempAuto, setTempAuto] = useState({
    interval: "day",
    target: "today",
    startDate: null,
    endDate: null,
    customIntervalValue: null,
    customIntervalUnit: "minute",
  }); // Temporary state for auto-clear modal
  const [showManualModal, setShowManualModal] = useState(false); // Manual clear modal visibility
  const [manualRange, setManualRange] = useState("day"); // Manual clear time range
  const [manualCol, setManualCol] = useState("all"); // Manual clear collection
  const [showAutoModal, setShowAutoModal] = useState(false); // Auto-clear modal visibility
  const [showLogModal, setShowLogModal] = useState(false); // Auto-clear log modal visibility
  const [logs, setLogs] = useState([]); // Auto-clear logs
  const [logCollection, setLogCollection] = useState("all"); // Selected collection for logs
  const [selectedConfigCollection, setSelectedConfigCollection] = useState(null); // Selected collection for auto-clear config

  // Alert modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [pendingManualClear, setPendingManualClear] = useState(false);
  const [pendingClearCount, setPendingClearCount] = useState(0);
  const [pendingDeleteConfig, setPendingDeleteConfig] = useState(false);

  const pageSize = 5; // Number of players per page

  // Fetch initial data (players, collections, auto-clear configs) when component mounts
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [playersRes, collectionsRes] = await Promise.all([
          fetch(`${baseUrl}/players`),
          fetch(`${baseUrl}/collections`),
        ]);
        const [playersData, collectionsData] = await Promise.all([
          playersRes.json(),
          collectionsRes.json(),
        ]);

        const finishedPlayers = playersData
          .filter(p => p.finishedAt)
          .sort((a, b) => a.totalTimeInSeconds - b.totalTimeInSeconds);
        setPlayers(finishedPlayers);

        const collectionsMap = {};
        collectionsData.forEach(c => (collectionsMap[c._id] = c.name));
        setCollections(collectionsMap);

        const configs = await Promise.all(
          collectionsData.map(async (col) => {
            const res = await fetch(`${baseUrl}/auto-clear-config/${col._id}`);
            return res.status === 200 ? { [col._id]: await res.json() } : { [col._id]: null };
          })
        );
        const configsMap = Object.assign({}, ...configs);
        setAutoClearConfigs(configsMap);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        setModalTitle("Error");
        setModalMessage("Failed to load leaderboard data.");
        setShowErrorModal(true);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Reset page to 0 when filter or collection changes
  useEffect(() => setPage(0), [filter, selectedCollection]);

  // Fetch auto-clear logs when log modal is opened for a specific collection
  useEffect(() => {
    if (showLogModal && selectedCollection !== "all") {
      async function fetchLogs() {
        try {
          const res = await fetch(`${baseUrl}/auto-clear-config/${selectedCollection}/logs`);
          const data = await res.json();
          setLogs(data);
        } catch (err) {
          console.error("Error fetching logs:", err);
          setModalTitle("Error");
          setModalMessage("Failed to fetch auto-clear logs.");
          setShowErrorModal(true);
        }
      }
      fetchLogs();
    }
  }, [showLogModal, selectedCollection]);

  // Filter players based on time filter and selected collection
  const filteredPlayers = players.filter(p =>
    isWithin(p.finishedAt, filter) &&
    (selectedCollection === "all" || p.collectionId === selectedCollection)
  );
  const totalPages = Math.ceil(filteredPlayers.length / pageSize);
  const pagedPlayers = filteredPlayers.slice(page * pageSize, (page + 1) * pageSize);

  // Format time in seconds to a readable string (e.g., 1h 2m 3s)
  const formatTime = (s) => {
    const m = Math.floor(s / 60), sec = s % 60;
    const h = Math.floor(m / 60);
    return `${h > 0 ? `${h}h ` : ""}${m % 60}m ${sec}s`;
  };

  // Format date to a readable string (e.g., "Jan 1, 2025, 12:00")
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString("en-SG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // Manual Clear
  const openManual = () => {
    setManualRange("day");
    setManualCol("all");
    setShowManualModal(true);
  };

  const closeManual = () => setShowManualModal(false);

  const confirmManualClear = async () => {
    setShowManualModal(false);
    const count = filteredPlayers.filter(p =>
      isWithin(p.finishedAt, manualRange) &&
      (manualCol === "all" || p.collectionId === manualCol)
    ).length;

    setPendingClearCount(count);
    setModalTitle("Confirm Manual Clear");
    setModalMessage(
      `You are about to remove ${count} player(s) from ${manualRange === "all" ? "All Time" : FILTERS.find(f => f.value === manualRange)?.label} in ${manualCol === "all" ? "All Collections" : collections[manualCol]}. Proceed?`
    );
    setPendingManualClear(true);
    setShowConfirmModal(true);
  };

  const doManualClear = async () => {
    try {
      if (manualRange === "all" && manualCol === "all") {
        await fetch(`${baseUrl}/players/clear`, { method: "DELETE" });
      } else {
        await fetch(`${baseUrl}/players/manual-clear/${manualRange}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manualCol === "all" ? {} : { collectionId: manualCol }),
        });
      }
      setModalTitle("Success");
      setModalMessage("Players cleared successfully.");
      setShowSuccessModal(true);
      setPage(0);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setModalTitle("Error");
      setModalMessage("Failed to clear leaderboard.");
      setShowErrorModal(true);
    }
    setShowConfirmModal(false);
    setPendingManualClear(false);
  };

  // Auto-Clear
  const openAuto = () => {
    if (selectedCollection === "all") {
      setModalTitle("Error");
      setModalMessage("Please select a specific collection to configure auto-clear.");
      setShowErrorModal(true);
      return;
    }
    setSelectedConfigCollection(selectedCollection);
    const config = autoClearConfigs[selectedCollection] || {
      interval: "day",
      target: "today",
      startDate: null,
      endDate: null,
      customIntervalValue: null,
      customIntervalUnit: "minute",
    };
    setTempAuto(config);
    setShowAutoModal(true);
  };

  const closeAuto = () => {
    setShowAutoModal(false);
    setSelectedConfigCollection(null);
  };

  const confirmAuto = async () => {
    const payload = {
      interval: tempAuto.interval,
      target: tempAuto.target,
      clearTime: tempAuto.clearTime,
      ...(tempAuto.target === "custom" && {
        startDate: tempAuto.startDate,
        endDate: tempAuto.endDate,
      }),
      ...(tempAuto.interval === "custom" && {
        customIntervalValue: Number(tempAuto.customIntervalValue),
        customIntervalUnit: tempAuto.customIntervalUnit,
      }),
    };

    try {
      const response = await fetch(`${baseUrl}/auto-clear-config/${selectedConfigCollection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updatedConfig = await response.json();
      setAutoClearConfigs({
        ...autoClearConfigs,
        [selectedConfigCollection]: updatedConfig.config,
      });
      setModalTitle("Success");
      setModalMessage(`Auto-clear configuration saved for ${collections[selectedConfigCollection]}.`);
      setShowSuccessModal(true);
      setShowAutoModal(false);
    } catch (e) {
      setModalTitle("Error");
      setModalMessage("Failed to save auto-clear configuration.");
      setShowErrorModal(true);
    }
  };

  const deleteAuto = async () => {
    setShowAutoModal(false);
    setModalTitle("Confirm Delete");
    setModalMessage(`Are you sure you want to delete the auto-clear configuration for ${collections[selectedConfigCollection]}? This will stop all auto-clearing for this collection.`);
    setPendingDeleteConfig(true);
    setShowConfirmModal(true);
  };

  const confirmDeleteAuto = async () => {
    try {
      const response = await fetch(`${baseUrl}/auto-clear-config/${selectedConfigCollection}`, {
        method: "DELETE",
      });
      if (response.status === 200) {
        setAutoClearConfigs({
          ...autoClearConfigs,
          [selectedConfigCollection]: null,
        });
        setModalTitle("Success");
        setModalMessage(`Auto-clear configuration deleted for ${collections[selectedConfigCollection]}.`);
        setShowSuccessModal(true);
      } else {
        throw new Error("Failed to delete config");
      }
    } catch (e) {
      setModalTitle("Error");
      setModalMessage("Failed to delete auto-clear configuration.");
      setShowErrorModal(true);
    }
    setShowConfirmModal(false);
    setPendingDeleteConfig(false);
  };

  // View Logs
  const openLogs = () => {
    if (selectedCollection === "all") {
      setModalTitle("Error");
      setModalMessage("Please select a specific collection to view auto-clear logs.");
      setShowErrorModal(true);
      return;
    }
    setLogCollection(selectedCollection);
    setShowLogModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowConfirmModal(false);
    setPendingManualClear(false);
    setPendingDeleteConfig(false);
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="page-container">
        <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
        <div className="page-overlay"></div>
        <div className="page-content" style={{ textAlign: "center" }}>
          <Loading />
        </div>
      </div>
    );
  }

  // Main leaderboard UI
  return (
    <div className="page-container">
      <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
      <div className="page-overlay"></div>
      <div className="page-content leaderboard-page">
        <h1 className="leaderboard-title">Admin Leaderboard</h1>

        {/* Filter dropdowns for time and collection */}
        <div className="leaderboard-filters">
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select className="filter-select" value={selectedCollection} onChange={e => setSelectedCollection(e.target.value)}>
            <option value="all">All Collections</option>
            {Object.entries(collections).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Display auto-clear config info if a specific collection is selected */}
        {selectedCollection !== "all" && autoClearConfigs[selectedCollection] && (
          <div className="auto-clear-info">
            <p>
              <strong>Auto-Clear Config:</strong> Clear {autoClearConfigs[selectedCollection].interval === "custom" ? `every ${autoClearConfigs[selectedCollection].customIntervalValue} ${autoClearConfigs[selectedCollection].customIntervalUnit}` : `every ${autoClearConfigs[selectedCollection].interval}`} 
              {autoClearConfigs[selectedCollection].target === "custom" ? `, data from ${new Date(autoClearConfigs[selectedCollection].startDate).toLocaleDateString()} to ${new Date(autoClearConfigs[selectedCollection].endDate).toLocaleDateString()}` : `, ${autoClearConfigs[selectedCollection].target} data`}
            </p>
          </div>
        )}

        {/* Show message if no players match the filters */}
        {pagedPlayers.length === 0 ? (
          <div className="no-players">
            <p className="no-results">
              No completed players in {selectedCollection === "all" ? "All Collections" : collections[selectedCollection]}.
            </p>
            {filter !== "all" && (
              <p className="no-results-tip">
                Try changing the time filter to see more results.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Leaderboard table */}
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Time</th>
                  <th>Collection</th>
                  <th>Date</th>
                  <th>Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {pagedPlayers.map((player) => {
                  const rank = filteredPlayers.findIndex(p => p._id === player._id) + 1;
                  return (
                    <tr
                      key={player._id}
                      className="leaderboard-row"
                      onMouseEnter={() => setHoveredPlayerId(player._id)}
                      onMouseLeave={() => setHoveredPlayerId(null)}
                    >
                      <td>{rank}</td>
                      <td style={{ position: "relative" }}>
                        {player.username}
                        {hoveredPlayerId === player._id && (
                          <div className="player-tooltip">
                            <div><strong>Collection:</strong> {collections[player.collectionId] || "Unknown"}</div>
                            <div><strong>Finished:</strong> {formatDate(player.finishedAt)}</div>
                            {player.redeemed && <div><strong>Redeemed:</strong> {formatDate(player.redeemedAt)}</div>}
                          </div>
                        )}
                      </td>
                      <td>{formatTime(player.totalTimeInSeconds)}</td>
                      <td>{collections[player.collectionId] || "Unknown"}</td>
                      <td>{formatDate(player.finishedAt)}</td>
                      <td>{player.redeemed ? "✓" : "✗"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="pagination leaderboard-pagination">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="pagination-btn"
                >
                  ← Prev
                </button>
                <span className="pagination-info">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Action buttons for manual clear, auto-clear, logs, and return */}
        <div className="admin-action-buttons">
          <button
            onClick={openManual}
            className="manual-clear-btn"
          >
            Manual Clear
          </button>
          <button
            onClick={openAuto}
            className="auto-clear-btn"
          >
            Auto-Clear
          </button>
          <button
            onClick={openLogs}
            className="log-btn"
          >
            View Auto-Clear Logs
          </button>
          <button className="return-button" onClick={() => navigate("/admin")}>
            Return
          </button>
        </div>
      </div>

      {/* Modal for configuring manual leaderboard clearing */}
      <ManualClearModal
        isOpen={showManualModal}
        manualRange={manualRange}
        setManualRange={setManualRange}
        manualCol={manualCol}
        setManualCol={setManualCol}
        collections={collections}
        onConfirm={confirmManualClear}
        onClose={closeManual}
      />
      {/* Modal for setting up automatic leaderboard clearing */}
      <AutoClearModal
        isOpen={showAutoModal}
        autoClear={autoClearConfigs[selectedConfigCollection]}
        tempAuto={tempAuto}
        setTempAuto={setTempAuto}
        onConfirm={confirmAuto}
        onDelete={deleteAuto}
        collectionName={collections[selectedConfigCollection] || "Selected Collection"}
        onClose={closeAuto}
      />
      {/* Modal for viewing auto-clear logs */}
      <AutoClearLogModal
        isOpen={showLogModal}
        collections={collections}
        logs={logs}
        setLogCollection={setLogCollection}
        logCollection={logCollection}
        onClose={() => setShowLogModal(false)}
      />
      {/* Modal for confirming manual clear or auto-clear config deletion */}
      <AlertModal
        isOpen={showConfirmModal && (pendingManualClear || pendingDeleteConfig)}
        onClose={handleModalClose}
        onConfirm={pendingManualClear ? doManualClear : confirmDeleteAuto}
        title={modalTitle}
        message={modalMessage}
        confirmText={pendingManualClear ? "Clear" : "Delete"}
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />
      {/* Modal for showing success messages */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />
      {/* Modal for showing error messages */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="info"
        showCancel={false}
      />
    </div>
  );
}