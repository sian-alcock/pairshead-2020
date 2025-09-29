import React from "react";
import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import TextButton from "../../atoms/TextButton/TextButton";

interface DataLoaderProps {
  url: string;
  buttonText: string;
  queryKeyToInvalidate?: QueryKey;
}

const DataLoader: React.FC<DataLoaderProps> = ({ url, buttonText, queryKeyToInvalidate }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, void>({
    mutationFn: async (): Promise<any> => {
      const response: AxiosResponse = await axios.get(url);
      console.log(response.data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch queries that depend on this data
      if (queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      }
    },
    onError: (error: Error) => {
      // Handle error if needed
      console.error("Data loading failed:", error);
    }
  });

  return (
    <div>
      <TextButton
        label={buttonText}
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        loading={mutation.isPending}
      />
    </div>
  );
};

export default DataLoader;
