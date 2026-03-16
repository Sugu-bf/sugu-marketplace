"use client";

/**
 * ChatSkeleton — loading skeleton for both conversation list and chat room.
 */

export function ConversationListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-border-light"
        >
          <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 skeleton rounded" />
              <div className="h-3 w-12 skeleton rounded" />
            </div>
            <div className="h-3 w-3/4 skeleton rounded" />
            <div className="h-3 w-16 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatRoomSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex justify-start">
          <div className="h-16 w-52 skeleton rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-44 skeleton rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <div className="h-10 w-60 skeleton rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <div className="h-20 w-48 skeleton rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <div className="h-12 w-36 skeleton rounded-2xl" />
        </div>
      </div>

      {/* Composer skeleton */}
      <div className="px-4 py-3 border-t border-border-light">
        <div className="h-11 skeleton rounded-full" />
      </div>
    </div>
  );
}
