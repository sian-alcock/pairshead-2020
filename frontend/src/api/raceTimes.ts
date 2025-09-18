import axios from "axios";

interface FetchRaceTimesParams {
  race: number;
  tap: string;
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  noPagination?: boolean;
}

export const fetchRaceTimes = async (params: FetchRaceTimesParams) => {
  const queryParams = new URLSearchParams();

  queryParams.append("race_id", params.race.toString());
  queryParams.append("tap", params.tap);

  if (params.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params.pageSize) {
    queryParams.append("page_size", params.pageSize.toString());
  }

  if (params.search) {
    queryParams.append("search", params.search);
  }

  if (params.ordering) {
    queryParams.append("ordering", params.ordering);
  }

  const response = await axios.get(`/api/race-times/?${queryParams}`);

  return response.data;
};
