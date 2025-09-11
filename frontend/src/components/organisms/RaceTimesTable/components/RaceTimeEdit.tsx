import React, { useEffect, useState } from "react";
import { AsyncPaginate, LoadOptions } from "react-select-async-paginate";
import { GroupBase, OptionsOrGroups } from "react-select";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatTimes } from "../../../../lib/helpers";
import Header from "../../../organisms/Header/Header";
import { CrewProps, TimeProps } from "../../../../types/components.types";
import TextButton from "../../../atoms/TextButton/TextButton";
import { useHistory, useParams } from "react-router-dom";
import Hero from "../../../organisms/Hero/Hero";
import { fetchJSON } from "../../../../lib/api";

import "./raceTimeEdit.scss";

type RaceTimeParams = {
  id: string;
};

type OptionType = {
  value: number | null;
  label: string;
};

type AdditionalType = {
  page: number;
};

// Backend response type for paginated crews
type PaginatedCrewsResponse = {
  results: CrewProps[];
  count: number;
  next: string | null;
  previous: string | null;
};

export default function RaceTimeEdit() {
  const [crewId, setCrewId] = useState<number | null>(null);
  const [selectedCrewOption, setSelectedCrewOption] = useState<OptionType | null>(null);
  const routeParams = useParams<RaceTimeParams>();
  const history = useHistory();
  const queryClient = useQueryClient();

  // Query for race time data
  const raceTimeQuery = useQuery<TimeProps, Error>({
    queryKey: ["raceTime", routeParams.id],
    queryFn: () => fetchJSON<TimeProps>(`/api/race-times/${routeParams.id}`)
  });

  useEffect(() => {
    if (raceTimeQuery.isSuccess && raceTimeQuery.data) {
      setCrewId(raceTimeQuery.data.crew?.id ?? null);
    }
  }, [raceTimeQuery.isSuccess, raceTimeQuery.data]);

  useEffect(() => {
    if (raceTimeQuery.isError && raceTimeQuery.error) {
      console.error("Error fetching race time:", raceTimeQuery.error);
    }
  }, [raceTimeQuery.isError, raceTimeQuery.error]);

  // Load the specific crew for the current race time to set initial value
  useEffect(() => {
    const loadInitialCrew = async () => {
      if (raceTimeQuery.data?.crew?.id && !selectedCrewOption) {
        try {
          const crew = await fetchJSON<CrewProps>(`/api/crews/${raceTimeQuery.data.crew.id}`);
          const option: OptionType = {
            value: crew.id,
            label: `${crew.bib_number} | ${crew.id} | ${crew.competitor_names} | ${
              crew.times.filter((time) => time.tap === "Start").length
            } start time(s) | ${crew.times.filter((time) => time.tap === "Finish").length} finish time(s)`
          };
          setSelectedCrewOption(option);
        } catch (error) {
          console.error("Error loading initial crew:", error);
        }
      } else if (!raceTimeQuery.data?.crew?.id && !selectedCrewOption) {
        setSelectedCrewOption({ value: null, label: "No crew assigned" });
      }
    };

    loadInitialCrew();
  }, [raceTimeQuery.data, selectedCrewOption]);

  const updateRaceTimeMutation = useMutation({
    mutationFn: async (data: { crewId: number | null }) => {
      const raceTimePayload = { ...raceTimeQuery.data, crew: data.crewId || null };

      const updatedRaceTime = await fetchJSON<TimeProps>(`/api/race-times/${routeParams.id}`, {
        method: "PUT",
        body: JSON.stringify(raceTimePayload)
      });

      if (data.crewId) {
        // Get crew record
        const crewToBeUpdated = await fetchJSON<CrewProps>(`/api/crews/${data.crewId}`);
        const crewData = { ...crewToBeUpdated, requires_recalculation: true };

        await fetchJSON(`/api/crews/${data.crewId}`, {
          method: "PUT",
          body: JSON.stringify(crewData)
        });

        // Other race times for this crew
        const currentTap = raceTimeQuery.data?.tap;
        const otherTimesForSelectedCrew = await fetchJSON<TimeProps[]>(
          `/api/race-times?tap=${currentTap}&crew__id=${data.crewId}`
        );

        if (otherTimesForSelectedCrew.length > 1) {
          const raceTimesToRemove = otherTimesForSelectedCrew.filter((time) => time.id !== raceTimeQuery.data?.id);

          for (const timeToRemove of raceTimesToRemove) {
            const raceTimeToRemoveFormData = await fetchJSON<TimeProps>(`/api/race-times/${timeToRemove.id}`);

            await fetchJSON(`/api/race-times/${timeToRemove.id}`, {
              method: "PUT",
              body: JSON.stringify({ ...raceTimeToRemoveFormData, crew: null })
            });
          }
        }
      }

      return updatedRaceTime;
    },
    onSuccess: (updatedRaceTime) => {
      queryClient.invalidateQueries({ queryKey: ["raceTime", routeParams.id] });

      const raceId = updatedRaceTime.race?.id;
      const tap = updatedRaceTime.tap;

      if (raceId && tap) {
        sessionStorage.setItem("crew-dashboard-active-tab", `race-${raceId}-${tap.toLowerCase()}`);
        history.push("/crew-management-dashboard");
      } else {
        history.push("/crew-management-dashboard");
      }
    },
    onError: (error) => {
      console.error("Error updating race time:", error);
    }
  });

  const formatCrewOption = (crew: CrewProps): OptionType => ({
    label: `${crew.bib_number} | ${crew.id} | ${crew.competitor_names} | ${
      crew.times.filter((time) => time.tap === "Start").length
    } start time(s) | ${crew.times.filter((time) => time.tap === "Finish").length} finish time(s)`,
    value: crew.id
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateRaceTimeMutation.mutate({ crewId });
  };

  const handleSelectChange = (selectedOption: OptionType | null) => {
    setCrewId(selectedOption?.value || null);
    setSelectedCrewOption(selectedOption);
  };

  const defaultAdditional: AdditionalType = { page: 1 };

  const loadOptions: LoadOptions<OptionType, GroupBase<OptionType>, AdditionalType> = async (
    search,
    _loadedOptions,
    additional
  ) => {
    try {
      const page = additional?.page ?? 1;
      const searchParam = search.trim();

      // Build query parameters for the backend
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "25", // Adjust based on your backend's page size
        ...(searchParam && { search: searchParam })
      });

      // Fetch from your paginated crews endpoint
      const response = await fetchJSON<PaginatedCrewsResponse>(`/api/crews/?${params.toString()}`);

      // Convert crews to options
      const crewOptions: OptionType[] = response.results.map(formatCrewOption);

      // Add "No crew assigned" option only on first page and when no search
      const options =
        page === 1 && !searchParam ? [{ value: null, label: "No crew assigned" }, ...crewOptions] : crewOptions;

      return {
        options,
        hasMore: !!response.next, // Use the backend's indication of more pages
        additional: { page: page + 1 }
      };
    } catch (error) {
      console.error("Error loading crews:", error);
      return {
        options: [],
        hasMore: false,
        additional: { page: 1 }
      };
    }
  };

  const isRaceTimeLoading = raceTimeQuery.isLoading;
  const raceTimeData = raceTimeQuery.data;

  if (isRaceTimeLoading) {
    return (
      <>
        <Header />
        <Hero title={"Modify time assignment"} />
        <section className="race-time-edit__section">
          <div className="race-time-edit__container">Loading...</div>
        </section>
      </>
    );
  }

  if (!raceTimeData) {
    return (
      <>
        <Header />
        <Hero title={"Modify time assignment"} />
        <section className="race-time-edit__section">
          <div className="race-time-edit__container">Race time not found</div>
        </section>
      </>
    );
  }

  const { mutate, isPending } = updateRaceTimeMutation;

  return (
    <>
      <Header />
      <Hero title={"Modify time assignment"} />
      <section className="race-time-edit__section">
        <div className="race-time-edit__container">
          <form className="race-time-edit__form" onSubmit={handleSubmit}>
            <div className="race-time-edit__info-box">
              <div>Sequence: {raceTimeData.sequence}</div>
              <div>Tap: {raceTimeData.tap}</div>
              <div>Tap time: {formatTimes(raceTimeData.time_tap)}</div>
            </div>

            <div className="race-time-edit__field">
              <label className="label" htmlFor="crew">
                Crew
              </label>
              <AsyncPaginate
                id="crew"
                additional={defaultAdditional}
                value={selectedCrewOption}
                loadOptions={loadOptions}
                onChange={handleSelectChange}
                placeholder="Select crew or leave unassigned..."
                isClearable
                cacheUniqs={[]} // Disable caching to ensure fresh data on each search
              />
            </div>

            <TextButton
              onClick={() => updateRaceTimeMutation.mutate({ crewId })}
              disabled={isPending}
              label={isPending ? "Saving…" : "Save"}
            />
          </form>
        </div>
      </section>
    </>
  );
}
