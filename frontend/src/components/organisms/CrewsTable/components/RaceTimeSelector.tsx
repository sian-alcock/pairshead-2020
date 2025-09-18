import React, { useEffect, useState } from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import { GroupBase, OptionsOrGroups } from "react-select";
import { formatTimes } from "../../../../lib/helpers";
import { fetchRaceTimes } from "../../../../api/raceTimes";
import axios from "axios"; // Add this import

type RaceTimeSelectorProps = {
  crewId: number;
  raceTimeId?: number | null;
  raceId?: number | null;
  tap: "Start" | "Finish";
  onChange: (newRaceTimeId: number | null) => void;
};

interface RaceTimeOption {
  value: number | "unassign";
  label: string;
  data?: any; // Original race time data
}

interface LoadOptions {
  options: RaceTimeOption[];
  hasMore: boolean;
  additional: {
    page: number;
  };
}

export const RaceTimeSelector: React.FC<RaceTimeSelectorProps> = ({ crewId, raceTimeId, raceId, tap, onChange }) => {
  const [selectedValue, setSelectedValue] = useState<RaceTimeOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to load options with pagination
  const loadOptions = async (
    searchValue: string,
    loadedOptions: OptionsOrGroups<RaceTimeOption, GroupBase<RaceTimeOption>>,
    additional?: { page: number }
  ): Promise<LoadOptions> => {
    if (!raceId) {
      return {
        options: [],
        hasMore: false,
        additional: { page: 1 }
      };
    }

    try {
      setIsLoading(true);
      const page = additional?.page || 1;
      const pageSize = 25; // Reasonable page size for dropdown

      const response = await fetchRaceTimes({
        race: raceId,
        tap,
        page,
        pageSize,
        search: searchValue || undefined // Only include search if there's a value
      });

      const options: RaceTimeOption[] = (response.results || []).map((raceTime: any) => ({
        value: raceTime.id,
        label: `${raceTime.sequence} - ${formatTimes(raceTime.time_tap)}`,
        data: raceTime
      }));

      // Add "Unassign" option only on the first page and if no search
      const allOptions =
        page === 1 && !searchValue ? [{ value: "unassign" as const, label: "Unassign" }, ...options] : options;

      return {
        options: allOptions,
        hasMore: !!response.next, // Django pagination provides 'next' field
        additional: {
          page: page + 1
        }
      };
    } catch (error) {
      console.error("Error loading race times:", error);
      return {
        options: [],
        hasMore: false,
        additional: { page: 1 }
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection change
  const handleSelect = (newValue: RaceTimeOption | null) => {
    setSelectedValue(newValue);

    if (!newValue || newValue.value === "unassign") {
      onChange(null);
    } else {
      onChange(newValue.value as number);
    }
  };

  // Helper function to fetch a single race time by ID
  const fetchRaceTimeById = async (id: number) => {
    console.log(`Fetching race time details for ID: ${id}`);
    const response = await axios.get(`/api/race-times/${id}`);
    console.log("Race time detail response:", response.data);
    return response.data;
  };

  // Update selected value when raceTimeId prop changes
  useEffect(() => {
    console.log("useEffect triggered with raceTimeId:", raceTimeId);

    if (!raceTimeId) {
      setSelectedValue({ value: "unassign", label: "Unassign" });
      return;
    }

    // Use the detail endpoint to get the race time
    const loadCurrentSelection = async () => {
      try {
        console.log(`About to fetch race time with ID: ${raceTimeId}`);
        const raceTimeData = await fetchRaceTimeById(raceTimeId);
        console.log("Received race time data:", raceTimeData);
        console.log("Sequence:", raceTimeData.sequence, "Time tap:", raceTimeData.time_tap);

        setSelectedValue({
          value: raceTimeData.id,
          label: `${raceTimeData.sequence} - ${formatTimes(raceTimeData.time_tap)}`,
          data: raceTimeData
        });
      } catch (error: unknown) {
        console.error("Error loading current selection:", error);
        if (axios.isAxiosError(error)) {
          console.log("Axios error details:", {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
          });
        }

        // Fallback with more helpful message
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setSelectedValue({
            value: raceTimeId,
            label: `Race time (ID: ${raceTimeId}) - Not found`
          });
        } else {
          setSelectedValue({
            value: raceTimeId,
            label: `Race time (ID: ${raceTimeId}) - Error loading`
          });
        }
      }
    };

    loadCurrentSelection();
  }, [raceTimeId]);

  return (
    <div className="race-time-selector">
      <label htmlFor="select-race-time" className="block text-sm font-medium text-gray-700 mb-1">
        Select race time
      </label>
      <AsyncPaginate
        inputId="select-race-time"
        value={selectedValue}
        loadOptions={loadOptions}
        onChange={handleSelect}
        additional={{ page: 1 }}
        placeholder="Search race times..."
        isClearable
        isSearchable
        isLoading={isLoading}
        isDisabled={!raceId}
        className="react-select-container"
        classNamePrefix="react-select"
        // Optional: debounce search input
        debounceTimeout={300}
        // Optional: customize messages
        noOptionsMessage={({ inputValue }) =>
          inputValue ? `No race times found for "${inputValue}"` : "No race times available"
        }
        loadingMessage={() => "Loading race times..."}
        // Optional: control when to load more options
        menuShouldScrollIntoView={false}
      />
    </div>
  );
};
