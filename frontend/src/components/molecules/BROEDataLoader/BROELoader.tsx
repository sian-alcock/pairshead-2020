import React, { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { formatTimeDate } from "../../../lib/helpers";
import TextButton from "../../atoms/TextButton/TextButton";
import { FeedbackModal } from "../FeedbackModal/FeedbackModal";
import ProgressMessage from "../../atoms/ProgressMessage/ProgressMessage";
import { PaginatedResponse } from "../../../types/components.types";
import { useCurrentRaceMode } from "../../hooks/useGlobalSettings";
import { useDataStats } from "../../../hooks/useDataStats";
import "./importBroeData.scss";

// Types
interface ImportStep {
  id: string;
  message: string;
  status: "pending" | "loading" | "success" | "error";
  error?: string;
  count?: number;
}

interface BROELoaderProps {
  importPersonalData?: boolean;
}

interface ApiResponse {
  updated?: string;
  count?: number;
  [key: string]: any;
}

interface GlobalSetting {
  id: number;
  [key: string]: any;
}

// API functions
const importApis = {
  clubs: () => axios.get<ApiResponse[]>("/api/club-data-import/"),
  events: () => axios.get<ApiResponse[]>("/api/event-data-import/"),
  bands: () => axios.get<ApiResponse[]>("/api/band-data-import/"),
  crews: (apiEndpoint: string) => axios.get<ApiResponse[]>(apiEndpoint),
  competitors: () => axios.get<ApiResponse[]>("/api/competitor-data-import"),
  eventBands: () => axios.get<ApiResponse[]>("/api/crew-get-event-band/"),
  getSettings: () => axios.get<PaginatedResponse<GlobalSetting>>("api/global-settings-list/"),
  updateSettings: (id: number, data: FormData) => axios.put(`/api/global-settings-list/${id}`, data),
  createSettings: (data: FormData) => axios.post("/api/global-settings-list/", data)
};

const BROELoader: React.FC<BROELoaderProps> = ({ importPersonalData = false }) => {
  const queryClient = useQueryClient();
  const { raceMode } = useCurrentRaceMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [steps, setSteps] = useState<ImportStep[]>([]);

  // Get current stats to potentially update them after import
  const { data: currentStats } = useDataStats(raceMode);

  const crewApi = importPersonalData ? "api/crew-data-import/1" : "api/crew-data-import/";

  const initialSteps: ImportStep[] = [
    { id: "clubs-events", message: "Importing clubs and events from British Rowing", status: "pending" },
    { id: "bands", message: "Importing event band data from British Rowing", status: "pending" },
    { id: "crews", message: "Importing crew data from British Rowing", status: "pending" },
    { id: "competitors", message: "Importing competitor data from British Rowing", status: "pending" },
    { id: "event-bands", message: "Updating event bands for all crews", status: "pending" }
  ];

  const updateStep = useCallback((stepId: string, updates: Partial<ImportStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)));
  }, []);

  const updateGlobalSettings = async (updatedTime: string): Promise<void> => {
    try {
      const settingsResponse = await importApis.getSettings();
      const formData = new FormData();
      formData.append("broe_data_last_update", updatedTime);

      if (settingsResponse.data.results.length > 0) {
        await importApis.updateSettings(settingsResponse.data.results[0].id, formData);
      } else {
        await importApis.createSettings(formData);
      }
    } catch (error) {
      console.error("Failed to update global settings:", error);
      // Don't throw here as this is not critical to the main flow
    }
  };

  const getSuccessMessage = (baseMessage: string, count?: number): string => {
    if (count !== undefined && count > 0) {
      // Extract the item type from the message
      let itemType = "items";
      if (baseMessage.includes("clubs")) itemType = "clubs";
      else if (baseMessage.includes("events")) itemType = "events";
      else if (baseMessage.includes("bands")) itemType = "bands";
      else if (baseMessage.includes("crew")) itemType = "crews";
      else if (baseMessage.includes("competitor")) itemType = "competitors";

      return `${baseMessage} - ${count} ${itemType} imported successfully`;
    }
    return `${baseMessage} - completed successfully`;
  };

  const updateStatsCache = useCallback(async () => {
    // Convert raceMode to phase format to match what the Home component uses
    const phase = raceMode === "PRE_RACE" ? "pre-race" : raceMode === "RACE" ? "race" : "pre-race";

    try {
      console.log(`Updating stats cache for phase: ${phase}`);

      // Approach 1: Try invalidateQueries first (safest)
      queryClient.invalidateQueries({
        queryKey: ["data-stats", phase],
        exact: true,
        refetchType: "active"
      });

      // Approach 2: If that doesn't work, force a refetch after a short delay
      setTimeout(async () => {
        try {
          await queryClient.refetchQueries({
            queryKey: ["data-stats", phase],
            exact: true,
            type: "active" // Only refetch active queries
          });
          console.log("Stats force-refetched successfully");
        } catch (refetchError) {
          console.error("Force refetch failed:", refetchError);

          // Approach 3: Last resort - remove and let it refetch naturally
          queryClient.removeQueries({
            queryKey: ["data-stats", phase],
            exact: true
          });
          console.log("Stats removed from cache - will refetch on next access");
        }
      }, 200);
    } catch (error) {
      console.error("Failed to update stats cache:", error);
    }
  }, [raceMode, queryClient]);

  const importMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      setSteps(initialSteps);
      setIsModalOpen(true);

      let hasErrors = false;
      let lastUpdated = "";

      try {
        // Step 1: Import clubs and events in parallel
        updateStep("clubs-events", { status: "loading" });

        const [clubsResponse, eventsResponse] = await Promise.allSettled([importApis.clubs(), importApis.events()]);

        // Check if either failed
        if (clubsResponse.status === "rejected" || eventsResponse.status === "rejected") {
          hasErrors = true;
          let errorMsg = "Failed to import clubs/events";

          if (clubsResponse.status === "rejected") {
            errorMsg = clubsResponse.reason instanceof Error ? clubsResponse.reason.message : "Failed to import clubs";
          } else if (eventsResponse.status === "rejected") {
            errorMsg =
              eventsResponse.reason instanceof Error ? eventsResponse.reason.message : "Failed to import events";
          }

          updateStep("clubs-events", { status: "error", error: errorMsg });
        } else {
          // Calculate total count from both responses
          const clubsCount = Array.isArray(clubsResponse.value.data) ? clubsResponse.value.data.length : 0;
          const eventsCount = Array.isArray(eventsResponse.value.data) ? eventsResponse.value.data.length : 0;
          const totalCount = clubsCount + eventsCount;

          updateStep("clubs-events", {
            status: "success",
            count: totalCount,
            message: getSuccessMessage("Importing clubs and events from British Rowing", totalCount)
          });
          console.log("Clubs and events imported:", clubsResponse.value.data, eventsResponse.value.data);
        }

        // Step 2: Import bands
        updateStep("bands", { status: "loading" });
        try {
          const bandsResponse = await importApis.bands();
          const bandsCount = Array.isArray(bandsResponse.data) ? bandsResponse.data.length : 0;

          updateStep("bands", {
            status: "success",
            count: bandsCount,
            message: getSuccessMessage("Importing event band data from British Rowing", bandsCount)
          });
          console.log("Bands imported:", bandsResponse.data);
        } catch (error) {
          hasErrors = true;
          updateStep("bands", {
            status: "error",
            error: error instanceof Error ? error.message : "Failed to import bands"
          });
        }

        // Step 3: Import crews
        updateStep("crews", { status: "loading" });
        try {
          const crewsResponse = await importApis.crews(crewApi);
          const crewsCount = Array.isArray(crewsResponse.data) ? crewsResponse.data.length : 0;

          updateStep("crews", {
            status: "success",
            count: crewsCount,
            message: getSuccessMessage("Importing crew data from British Rowing", crewsCount)
          });
          lastUpdated = crewsResponse.data[0]?.updated || "";
          console.log("Crews imported:", crewsResponse.data);
        } catch (error) {
          hasErrors = true;
          updateStep("crews", {
            status: "error",
            error: error instanceof Error ? error.message : "Failed to import crews"
          });
        }

        // Step 4: Import competitors
        updateStep("competitors", { status: "loading" });
        try {
          const competitorsResponse = await importApis.competitors();
          const competitorsCount = Array.isArray(competitorsResponse.data) ? competitorsResponse.data.length : 0;

          updateStep("competitors", {
            status: "success",
            count: competitorsCount,
            message: getSuccessMessage("Importing competitor data from British Rowing", competitorsCount)
          });
          console.log("Competitors imported:", competitorsResponse.data);
        } catch (error) {
          hasErrors = true;
          updateStep("competitors", {
            status: "error",
            error: error instanceof Error ? error.message : "Failed to import competitors"
          });
        }

        // Step 5: Update event bands
        updateStep("event-bands", { status: "loading" });
        try {
          const eventBandsResponse = await importApis.eventBands();
          const eventBandsCount = Array.isArray(eventBandsResponse.data) ? eventBandsResponse.data.length : 0;

          updateStep("event-bands", {
            status: "success",
            count: eventBandsCount,
            message: getSuccessMessage("Updating event bands for all crews", eventBandsCount)
          });
          console.log("Event bands updated:", eventBandsResponse.data);
        } catch (error) {
          hasErrors = true;
          updateStep("event-bands", {
            status: "error",
            error: error instanceof Error ? error.message : "Failed to update event bands"
          });
        }

        // Update global settings with last updated time (non-critical)
        if (lastUpdated) {
          await updateGlobalSettings(lastUpdated);
        }

        if (hasErrors) {
          throw new Error("Some imports failed. Please check the details above.");
        }

        return lastUpdated;
      } catch (error) {
        // Update any remaining pending steps to error state
        setSteps((prev) =>
          prev.map((step) =>
            step.status === "pending" || step.status === "loading"
              ? { ...step, status: "error", error: "Process interrupted" }
              : step
          )
        );
        throw error;
      }
    },
    onSuccess: async (lastUpdated: any) => {
      // Only invalidate the queries that are actually being used elsewhere in the app
      // Remove the ones that aren't being used to avoid unnecessary requests
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["bands"] });
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      queryClient.invalidateQueries({ queryKey: ["competitors"] });

      // Update stats safely - this will refetch and trigger UI updates
      await updateStatsCache();

      console.log("All data imported successfully at:", lastUpdated);
    },
    onError: (error: any) => {
      console.error("Import process failed:", error);
    }
  });

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setSteps([]);
    document.body.classList.remove("lock-scroll");
  }, []);

  const handleImport = useCallback(() => {
    importMutation.mutate();
  }, [importMutation]);

  const isLoading = importMutation.isPending;
  const allStepsCompleted =
    steps.length > 0 && steps.every((step) => step.status === "success" || step.status === "error");
  const hasErrors = steps.some((step) => step.status === "error");

  return (
    <div className="c-data-loader">
      <TextButton label="Get BROE data" onClick={handleImport} disabled={isLoading} />

      {isModalOpen && (
        <FeedbackModal isOpen={true} closeModal={handleClose}>
          {steps.map((step) => (
            <ProgressMessage
              key={step.id}
              message={step.error ? `${step.message}: ${step.error}` : step.message}
              status={step.status === "pending" ? "loading" : step.status}
            />
          ))}

          {allStepsCompleted && (
            <ProgressMessage
              message={
                hasErrors
                  ? "Import completed with errors. Please review the failed steps above."
                  : `All British Rowing data imported successfully: ${formatTimeDate(new Date().toISOString())}`
              }
              status={hasErrors ? "error" : "success"}
            />
          )}
        </FeedbackModal>
      )}
    </div>
  );
};

export default BROELoader;
