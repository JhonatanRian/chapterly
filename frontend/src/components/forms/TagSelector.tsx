import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { TagBadge } from "@/components/common/TagBadge";
import type { Tag } from "@/types";
import api from "@/services/api";
import { ENDPOINTS } from "@/utils/constants";

interface TagSelectorProps {
  selectedTags: number[];
  onChange: (tagIds: number[]) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function TagSelector({
  selectedTags,
  onChange,
  error,
  disabled = false,
  className,
  label = "Tags",
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch all tags
  const {
    data: tagsResponse,
    isLoading,
    error: queryError,
  } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await api.get<Tag[]>(ENDPOINTS.TAGS);
      console.log("🏷️ Tags API Response:", response.data);
      console.log("🏷️ Is Array?", Array.isArray(response.data));

      // Handle if response is paginated or wrapped
      if (response.data && typeof response.data === "object") {
        // Check if it's a paginated response with 'results' field
        if (
          "results" in response.data &&
          Array.isArray(response.data.results)
        ) {
          console.log("🏷️ Found paginated response, extracting results");
          return response.data.results;
        }
        // Check if it's directly an array
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      console.error("🏷️ Unexpected response format:", response.data);
      return [];
    },
  });

  // Ensure tags is always an array
  const tags = Array.isArray(tagsResponse) ? tagsResponse : [];

  console.log("🏷️ Tags after processing:", tags);
  console.log("🏷️ Tags length:", tags.length);
  console.log("🏷️ Selected tags:", selectedTags);

  if (queryError) {
    console.error("🏷️ Query Error:", queryError);
  }

  const selectedTagObjects = tags.filter((tag) =>
    selectedTags.includes(tag.id),
  );

  const filteredTags = tags.filter(
    (tag) =>
      !selectedTags.includes(tag.id) &&
      tag.nome.toLowerCase().includes(search.toLowerCase()),
  );

  console.log("🔍 Search term:", search);
  console.log("🔍 Filtered tags:", filteredTags);
  console.log("🔍 Filtered tags length:", filteredTags.length);

  const handleToggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    onChange(selectedTags.filter((id) => id !== tagId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Selected Tags */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTagObjects.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={disabled ? undefined : () => handleRemoveTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2 text-left rounded-lg border transition-colors",
            "flex items-center justify-between",
            "bg-white dark:bg-gray-700",
            "text-gray-900 dark:text-gray-100",
            error
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600",
            !disabled && "hover:border-gray-400 dark:hover:border-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTags.length > 0
              ? `${selectedTags.length} ${selectedTags.length === 1 ? "tag selecionada" : "tags selecionadas"}`
              : "Selecione as tags"}
          </span>
          <svg
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform",
              isOpen && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <>
            {/* Overlay to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tags..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Tags List */}
              <div className="overflow-y-auto max-h-48">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Carregando...
                  </div>
                ) : queryError ? (
                  <div className="p-4 text-center text-sm text-red-500 dark:text-red-400">
                    Erro ao carregar tags
                  </div>
                ) : tags.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma tag disponível
                  </div>
                ) : filteredTags.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: tag.cor }}
                        >
                          {tag.nome}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.cor }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {search
                      ? "Nenhuma tag encontrada"
                      : "Todas as tags foram selecionadas"}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
