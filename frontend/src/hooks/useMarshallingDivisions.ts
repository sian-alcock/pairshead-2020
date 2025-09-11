import { useQuery } from "@tanstack/react-query";
import { fetchMarshallingDivisions } from "../api/marshallingDivisions";

export const useMarshallingDivisions = () => {
  return useQuery({
    queryKey: ["marshalling-divisions"],
    queryFn: fetchMarshallingDivisions,
    staleTime: 5 * 60 * 1000
  });
};
