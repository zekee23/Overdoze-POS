import { useQuery } from "@tanstack/react-query";
import api from '../utils/api';

export const usePOSData = () => {
  return useQuery({
    queryKey: ["posData"],

    queryFn: async () => {
      const response = await api.get('/pos-data');
      return response.data;
    },

    staleTime: 1000 * 60 * 5,    // Treat data as fresh for 5 minutes
    cacheTime: 1000 * 60 * 30,   // Keep it in memory for 30 minutes
    refetchOnWindowFocus: false, // Prevent refetching when switching tabs
  });
};
