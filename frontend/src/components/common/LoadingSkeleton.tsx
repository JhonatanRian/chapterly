import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface LoadingSkeletonProps {
  className?: string;
}

/**
 * Skeleton base com animação de pulse
 */
export function Skeleton({ className }: LoadingSkeletonProps) {
  return (
    <motion.div
      className={cn(
        "bg-gray-200 dark:bg-gray-700 rounded",
        className
      )}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/**
 * Skeleton para IdeaCard
 */
export function IdeaCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full mb-4" />

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-2" />

      {/* Description lines */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton para StatsCard
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full min-h-[160px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Value */}
      <Skeleton className="h-10 w-16 mb-2" />

      {/* Description */}
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Skeleton para TimelineCard
 */
export function TimelineCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-4">
        {/* Left side - image */}
        <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />

        {/* Right side - content */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />

          {/* Meta info */}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de comentários
 */
export function CommentSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton para grid de cards (com stagger)
 */
export function SkeletonGrid({
  count = 6,
  type = "idea",
}: {
  count?: number;
  type?: "idea" | "stats" | "timeline";
}) {
  const SkeletonComponent =
    type === "idea"
      ? IdeaCardSkeleton
      : type === "stats"
        ? StatsCardSkeleton
        : TimelineCardSkeleton;

  return (
    <div
      className={cn(
        "grid gap-6",
        type === "idea" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        type === "stats" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        type === "timeline" && "grid-cols-1",
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
          }}
        >
          <SkeletonComponent />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Skeleton para página de detalhes
 */
export function IdeaDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Image */}
      <Skeleton className="h-96 w-full rounded-lg" />

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>

      {/* Comments */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Skeleton className="h-6 w-32" />
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    </div>
  );
}

/**
 * Skeleton simples para tabela
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
