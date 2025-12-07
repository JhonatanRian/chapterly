import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export interface IdeaPermissions {
  editable: boolean;
  deletable: boolean;
  reschedulable: boolean;
}

export const useIdeaPermissions = (ideaId: string | undefined) => {
  return useQuery<IdeaPermissions>({
    queryKey: ["idea", ideaId, "permissions"],
    queryFn: async () => {
      if (!ideaId) throw new Error("Idea ID is required");
      const numericId = Number(ideaId);
      const { data } = await api.get(`/ideas/${numericId}/permissions/`);
      return data;
    },
    enabled: !!ideaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
