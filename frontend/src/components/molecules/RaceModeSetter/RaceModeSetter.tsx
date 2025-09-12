import React from "react";
import { Link, useHistory } from "react-router-dom";
import { useRaceMode, useCurrentEvent } from "../../hooks/useGlobalSettings";
import Auth from "../../../lib/Auth";
import "./raceModeSetter.scss";

export default function RaceModeSetter() {
  const { raceMode, updateRaceMode, isLoading, error } = useRaceMode();
  const { currentEventName, isLoading: eventLoading } = useCurrentEvent();
  const history = useHistory();

  const modes: Array<{ key: "PRE_RACE" | "RACE"; label: string }> = [
    { key: "PRE_RACE", label: "Pre-race" },
    { key: "RACE", label: "Race" }
  ];

  const handleRaceModeChange = async (mode: "PRE_RACE" | "RACE") => {
    try {
      await updateRaceMode(mode);
      // Navigate to home page after successful mode change
      history.push("/");
    } catch (err) {
      // Error handling - the error will be handled by the useRaceMode hook
      console.error("Failed to update race mode:", err);
    }
  };

  if (error) {
    return (
      <div className="race-mode-setter race-mode-setter--error">
        <div className="race-mode-setter__error">Error loading race mode: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="race-mode-setter">
      <div className="race-mode-setter__toggle">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`race-mode-setter__button ${raceMode === mode.key ? "active" : ""}`}
            onClick={() => handleRaceModeChange(mode.key)}
            disabled={isLoading}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className={`race-mode-setter__status-dot ${isLoading ? "loading" : ""}`}></div>
      <div className="race-mode-setter__event">
        {eventLoading ? (
          <span>Loading event...</span>
        ) : currentEventName ? (
          <>
            {Auth.isAuthenticated() ? (
              <span className="race-mode-setter__event-link">
                <Link to="/settings/keys">{currentEventName}</Link>
              </span>
            ) : (
              <span>{currentEventName}</span>
            )}
          </>
        ) : (
          <>
            {Auth.isAuthenticated() && (
              <span className="race-mode-setter__event-link">
                <Link to="/settings/keys">Event</Link>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
