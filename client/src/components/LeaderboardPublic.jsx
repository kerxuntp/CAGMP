import React, { useEffect, useState } from "react";
import './MainStyles.css';
import './LeaderboardStyles.css'; 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const FILTERS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

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

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [collectionName, setCollectionName] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hoveredPlayerId, setHoveredPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const pageSize = 10;
  const currentPlayerId = sessionStorage.getItem("playerId");

  useEffect(() => {
    async function fetchData() {
      try {
        // First, get the current player to know their collection
        if (!currentPlayerId) {
          console.error("No current player ID found");
          setLoading(false);
          return;
        }

        const currentPlayerRes = await fetch(`${API_BASE_URL}/players/${currentPlayerId}`);
        const currentPlayerData = await currentPlayerRes.json();
        setCurrentPlayer(currentPlayerData);

        // Get all players and collections
        const [playersRes, collectionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/players`),
          fetch(`${API_BASE_URL}/collections`),
        ]);

        const [playersData, collectionsData] = await Promise.all([
          playersRes.json(),
          collectionsRes.json(),
        ]);

        // ✅ Filter to only show players from the same collection who have finished
        const finishedPlayersFromSameCollection = playersData.filter(p => 
          p.finishedAt && p.collectionId === currentPlayerData.collectionId
        );

        // Sort by time (ascending - fastest first)
        const sorted = finishedPlayersFromSameCollection.sort((a, b) => 
          a.totalTimeInSeconds - b.totalTimeInSeconds
        );
        
        setPlayers(sorted);

        // Get the collection name for display
        const currentCollection = collectionsData.find(col => col._id === currentPlayerData.collectionId);
        setCollectionName(currentCollection?.name || "Unknown Collection");

        // Set page to show current player
        const currentIndex = sorted.findIndex(p => p._id === currentPlayerId);
        if (currentIndex >= 0) {
          setPage(Math.floor(currentIndex / pageSize));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentPlayerId]);

  useEffect(() => setPage(0), [filter]);

  const filteredPlayers = players.filter(p => isWithin(p.finishedAt, filter));
  const totalPages = Math.ceil(filteredPlayers.length / pageSize);
  const pagedPlayers = filteredPlayers.slice(page * pageSize, (page + 1) * pageSize);

  const formatTime = (s) => {
    const m = Math.floor(s / 60), sec = s % 60;
    const h = Math.floor(m / 60);
    return `${h > 0 ? `${h}h ` : ""}${m % 60}m ${sec}s`;
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString("en-SG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (loading) {
    return (
      <div className="page-container">
        <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
        <div className="page-overlay"></div>
        <div className="page-content" style={{ textAlign: "center" }}>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="page-container">
        <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
        <div className="page-overlay"></div>
        <div className="page-content" style={{ textAlign: "center" }}>
          <h2>Error: Player not found</h2>
          <button className="return-button" onClick={() => window.history.back()}>
            Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
      <div className="page-overlay"></div>

      <div className="page-content leaderboard-page">
        <h1 className="leaderboard-title">Leaderboard</h1>
        
        {/* ✅ Show which collection this leaderboard is for */}
        <h3 style={{ 
          textAlign: "center", 
          color: "#2196F3", 
          marginBottom: "20px",
          fontWeight: "600"
        }}>
          {collectionName} Collection
        </h3>

        {/* ✅ Only time filter, no collection filter needed */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
            style={{ minWidth: "150px" }}
          >
            {FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {pagedPlayers.length === 0 ? (
          <div style={{ textAlign: "center", margin: "40px 0" }}>
            <p className="no-results">
              No completed players in {collectionName} collection yet.
            </p>
            {filter !== "all" && (
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                Try changing the time filter to see more results.
              </p>
            )}
          </div>
        ) : (
          <>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {pagedPlayers.map((player) => {
                  const rank = filteredPlayers.findIndex(p => p._id === player._id);
                  const isCurrent = player._id === currentPlayerId;

                  const highlight =
                    rank === 0 ? "gold" :
                    rank === 1 ? "silver" :
                    rank === 2 ? "bronze" : "";

                  // ✅ Add subtle background for non-podium, non-current players
                  const getRowStyle = () => {
                    if (highlight || isCurrent) return {}; // Keep existing styling for podium/current
                    return { backgroundColor: "rgba(255, 255, 255, 0.40)" }; // Subtle translucent background
                  };

                  return (
                    <tr
                      key={player._id}
                      className={`${highlight} ${isCurrent ? "current-player" : ""}`}
                      style={getRowStyle()}
                      onMouseEnter={() => setHoveredPlayerId(player._id)}
                      onMouseLeave={() => setHoveredPlayerId(null)}
                    >
                      <td>{rank + 1}</td>
                      <td style={{ position: "relative" }}>
                        {player.username}
                        {isCurrent && <span className="you-indicator"> ← You</span>}

                        {/* ✅ Simplified tooltip - only show completion date */}
                        {hoveredPlayerId === player._id && (
                          <div className="player-tooltip">
                            <div><strong>Completed:</strong> {formatDate(player.finishedAt)}</div>
                          </div>
                        )}
                      </td>
                      <td>{formatTime(player.totalTimeInSeconds)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination" style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                gap: "20px", 
                margin: "20px 0",
                maxWidth: "300px",
                marginLeft: "auto",
                marginRight: "auto"
              }}>
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))} 
                  disabled={page === 0}
                  style={{ minWidth: "80px" }}
                >
                  ← Prev
                </button>
                <span style={{ textAlign: "center", minWidth: "100px" }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                  disabled={page >= totalPages - 1}
                  style={{ minWidth: "80px" }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button className="return-button" onClick={() => window.history.back()}>
            Return
          </button>
        </div>
      </div>
    </div>
  );
}