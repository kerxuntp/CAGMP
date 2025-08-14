import React, { useState } from "react";
import Tooltip from "./Tooltip";

const FILTERS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

export function ManualClearModal({ isOpen, manualRange, setManualRange, manualCol, setManualCol, collections, onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ color: "black" }}>
        <h3 style={{ color: "black" }}>Manual Clear</h3>
        <div style={{ marginBottom: 10, textAlign: "left", color: "black" }}>
          <label style={{ color: "black" }}>Range:</label>
          <select value={manualRange} onChange={(e) => setManualRange(e.target.value)}>
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 20, textAlign: "left", color: "black" }}>
          <label style={{ color: "black" }}>Collection:</label>
          <select value={manualCol} onChange={(e) => setManualCol(e.target.value)}>
            <option value="all">All Collections</option>
            {Object.entries(collections).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <button onClick={onConfirm} style={{ marginRight: 10, color: "black" }}>
          Confirm
        </button>
        <button onClick={onClose} style={{ color: "black" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AutoClearModal({ isOpen, autoClear, tempAuto, setTempAuto, onConfirm, onClose, onDelete, collectionName }) {
  if (!isOpen) return null;

  // Only allow 'custom' target when interval is 'custom'
  const isCustomInterval = tempAuto.interval === "custom";
  const isCustomIntervalInvalid = isCustomInterval && (!tempAuto.customIntervalValue || !tempAuto.customIntervalUnit);
  const isCustomRange = isCustomInterval && tempAuto.target === "custom";
  const isSaveDisabled =
    isCustomIntervalInvalid ||
    (isCustomRange && (!tempAuto.startDate || !tempAuto.endDate));

  const availableIntervals = [
    { label: "Daily", value: "day" },
    { label: "Weekly", value: "week" },
    { label: "Monthly", value: "month" },
    { label: "Custom Interval", value: "custom" },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ color: "black", maxWidth: "500px", width: "90%" }}>
        <h3 style={{ color: "black" }}>Auto-Clear Configuration for {collectionName}</h3>
        {autoClear && (
          <p style={{ fontSize: "0.9em", color: "black", marginBottom: "10px" }}>
            <strong style={{ color: "black" }}>Current:</strong> Clear {autoClear.interval === "custom" ? `every ${autoClear.customIntervalValue} ${autoClear.customIntervalUnit}` : `every ${autoClear.interval}`} 
            {autoClear.target === "custom" ? `, data from ${new Date(autoClear.startDate).toLocaleDateString()} to ${new Date(autoClear.endDate).toLocaleDateString()}` : `, ${autoClear.target} data`}
          </p>
        )}

        {/* Info Bubble using Tooltip */}
        {tempAuto.interval && (
          <Tooltip>
            {tempAuto.interval === "day" && (
              <span>
                <strong>Daily:</strong> Clears every day at the time you set.<br />
                <em>Default: 11:59PM</em>
              </span>
            )}
            {tempAuto.interval === "week" && (
              <span>
                <strong>Weekly:</strong> Clears every week on the same weekday and time you set.<br />
                <em>Default: Sunday 11:59PM</em>
              </span>
            )}
            {tempAuto.interval === "month" && (
              <span>
                <strong>Monthly:</strong> Clears every month on the same day and time you set.<br />
                <em>Default: Last day of the month 11:59PM</em>
              </span>
            )}
            {tempAuto.interval === "custom" && (
              <span>
                <strong>Custom:</strong> Clears at your chosen interval and time.
              </span>
            )}
          </Tooltip>
        )}

        {/* Default timing toggle for weekly/monthly */}
        {["week", "month"].includes(tempAuto.interval) && (
          <div style={{ marginBottom: 10, textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "bold", color: "black", whiteSpace: "nowrap" }}>
              Use default timing
            </span>
            <input
              type="checkbox"
              checked={!!tempAuto.useDefault}
              onChange={e => {
                const checked = e.target.checked;
                setTempAuto(t => ({
                  ...t,
                  useDefault: checked,
                  clearTime: checked ? "23:59" : t.clearTime || "00:00",
                  defaultDay: checked && tempAuto.interval === "week" ? "Sunday" : undefined,
                  defaultDayOfMonth: checked && tempAuto.interval === "month" ? "last" : undefined,
                }));
              }}
              style={{ marginLeft: "6px" }}
            />
          </div>
        )}

        <div style={{ marginBottom: 10, textAlign: "left", color: "black" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>Clear Frequency:</label>
          <select
            value={tempAuto.interval}
            onChange={(e) => {
              const newInterval = e.target.value;
              setTempAuto((t) => ({
                ...t,
                interval: newInterval,
                target: newInterval === "custom" ? t.target : newInterval === "day" ? "today" : newInterval === "week" ? "week" : "month",
                customIntervalValue: newInterval === "custom" ? t.customIntervalValue || 1 : null,
                customIntervalUnit: newInterval === "custom" ? t.customIntervalUnit || "minute" : null,
                clearTime:
                  newInterval === "day"
                    ? "23:59"
                    : newInterval === "week"
                    ? "23:59"
                    : newInterval === "month"
                    ? "23:59"
                    : t.clearTime || "00:00",
                useDefault: false,
                defaultDay: undefined,
                defaultDayOfMonth: undefined,
              }));
            }}
            style={{ width: "100%", padding: "5px" }}
          >
            {availableIntervals.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>

        {tempAuto.interval === "custom" && (
          <div style={{ marginBottom: 10, textAlign: "left", color: "black" }}>
            <label style={{ color: "black", fontWeight: "bold" }}>Custom Frequency:</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                min="1"
                value={tempAuto.customIntervalValue || ""}
                onChange={(e) => setTempAuto((t) => ({ ...t, customIntervalValue: e.target.value }))}
                placeholder="Enter number"
                style={{ color: "white", background: "#222", width: "120px", padding: "5px" }}
              />
              <select
                value={tempAuto.customIntervalUnit || "minute"}
                onChange={(e) => setTempAuto((t) => ({ ...t, customIntervalUnit: e.target.value }))}
                style={{ padding: "5px" }}
              >
                <option value="minute">Minutes</option>
                <option value="hour">Hours</option>
                <option value="day">Days</option>
              </select>
            </div>
          </div>
        )}

        {/* Only show Data to Clear dropdown for custom interval */}
        {tempAuto.interval === "custom" && (
          <div style={{ marginBottom: 10, textAlign: "left", color: "black" }}>
            <label style={{ color: "black", fontWeight: "bold" }}>Data to Clear:</label>
            <select
              value={tempAuto.target}
              onChange={(e) => {
                setTempAuto((t) => ({
                  ...t,
                  target: e.target.value,
                  startDate: e.target.value === "custom" ? t.startDate || new Date().toISOString().slice(0, 10) : null,
                  endDate: e.target.value === "custom" ? t.endDate || new Date().toISOString().slice(0, 10) : null,
                }));
              }}
              style={{ width: "100%", padding: "5px" }}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
              <option value="all">All Players</option>
            </select>
          </div>
        )}

        {tempAuto.target === "custom" && (
          <div style={{ marginBottom: 10, textAlign: "left", color: "black" }}>
            <label style={{ color: "black", fontWeight: "bold" }}>Date Range:</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label style={{ color: "black" }}>Start:</label>
                <input
                  type="date"
                  value={tempAuto.startDate?.slice(0, 10) || ""}
                  onChange={(e) => setTempAuto((t) => ({ ...t, startDate: e.target.value }))}
                  style={{ color: "white", padding: "5px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label style={{ color: "black" }}>End:</label>
                <input
                  type="date"
                  value={tempAuto.endDate?.slice(0, 10) || ""}
                  onChange={(e) => setTempAuto((t) => ({ ...t, endDate: e.target.value }))}
                  style={{ color: "white", padding: "5px" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Clear Time Picker */}
        <div style={{ marginBottom: 10, textAlign: "left", color: "black" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>Clear Time:</label>
          <input
            type="time"
            value={tempAuto.clearTime || "00:00"}
            onChange={e => setTempAuto(t => ({ ...t, clearTime: e.target.value }))}
            style={{ width: "120px", padding: "5px", color: "white", background: "#222" }}
            disabled={!!tempAuto.useDefault}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "15px" }}>
          {autoClear && (
            <button
              onClick={onDelete}
              style={{ 
                padding: "8px 16px", 
                borderRadius: "4px", 
                border: "none", 
                background: "#ff6b6b", 
                color: "white", 
                cursor: "pointer" 
              }}
            >
              Delete Config
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{ 
              padding: "8px 16px", 
              borderRadius: "4px", 
              border: "none", 
              background: isSaveDisabled ? "#ccc" : "#4ecdc4", 
              color: "white", 
              cursor: isSaveDisabled ? "not-allowed" : "pointer" 
            }}
            disabled={isSaveDisabled}
          >
            Save
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "4px", 
              border: "1px solid #ddd", 
              background: "transparent", 
              color: "black", 
              cursor: "pointer" 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function AutoClearLogModal({ isOpen, collections, logs, logCollection, onClose }) {
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const maxPages = 10; // Limit to 10 pages (30 logs)

  if (!isOpen) return null;

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString("en-SG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // ...existing code...

  // Helper to shorten date format
  const shortDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const filteredLogs = logs.filter(log => logCollection === "all" || log.collectionId === logCollection);
  const totalPages = Math.min(Math.ceil(filteredLogs.length / pageSize), maxPages);
  const pagedLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ 
        color: "black", 
        maxWidth: "500px", 
        width: "90%", 
        maxHeight: "80vh", 
        overflowY: "auto" 
      }}>
        <h3 style={{ color: "black", marginBottom: "10px" }}>Auto-Clear Logs</h3>
        {filteredLogs.length === 0 ? (
          <p style={{ color: "black", textAlign: "center" }}>
            No logs available for {logCollection === "all" ? "All Collections" : collections[logCollection]}.
          </p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                color: "black",
                fontSize: "14px"
              }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Date</th>
                    <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Collection</th>
                    <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Interval</th>
                    <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Target</th>
                    <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.map(log => (
                    <tr key={log._id}>
                      <td style={{ border: "1px solid #ddd", padding: "6px" }}>{formatDate(log.clearedAt)}</td>
                      <td style={{ border: "1px solid #ddd", padding: "6px" }}>{collections[log.collectionId] || "Unknown"}</td>
                      <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                        {log.interval === "custom"
                          ? "custom"
                          : log.interval}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                        {log.target === "custom" && log.range && log.range.start && log.range.end
                          ? `custom (${shortDate(log.range.start)}–${shortDate(log.range.end)})`
                          : log.target}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px" }}>{log.clearedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "10px",
                gap: "10px"
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: "5px 10px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    border: "none",
                    background: page === 0 ? "#ccc" : "#2196F3",
                    color: "white",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    minWidth: "60px"
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "12px", color: "black" }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: "5px 10px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    border: "none",
                    background: page >= totalPages - 1 ? "#ccc" : "#2196F3",
                    color: "white",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                    minWidth: "60px"
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
        <button 
          onClick={onClose} 
          style={{ 
            marginTop: "15px", 
            color: "black", 
            padding: "8px 16px", 
            borderRadius: "4px",
            border: "1px solid #ddd",
            background: "transparent",
            cursor: "pointer",
            width: "100%"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}