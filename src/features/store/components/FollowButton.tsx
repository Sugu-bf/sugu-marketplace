"use client";

import { useState, useCallback, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { followStore, unfollowStore } from "../api/store.api";
import { ApiError } from "@/lib/api";

interface FollowButtonProps {
  storeId: string;
  initialIsFollowed: boolean;
  initialFollowerCount: number;
}

/**
 * Follow / Unfollow button — Client Component.
 *
 * Uses optimistic UI: updates state immediately, reverts on error.
 * Redirects to login on 401.
 */
export default function FollowButton({
  storeId,
  initialIsFollowed,
  initialFollowerCount,
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = useCallback(async () => {
    if (isLoading) return;

    // Optimistic update
    const prevFollowed = isFollowed;
    const prevCount = followerCount;
    setIsFollowed(!isFollowed);
    setFollowerCount(isFollowed ? followerCount - 1 : followerCount + 1);
    setIsLoading(true);

    try {
      if (prevFollowed) {
        await unfollowStore(storeId);
      } else {
        await followStore(storeId);
      }

      // Revalidate server cache
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      // Revert optimistic update
      setIsFollowed(prevFollowed);
      setFollowerCount(prevCount);

      // Redirect to login if not authenticated
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isFollowed, followerCount, storeId, isLoading, router]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={handleToggleFollow}
        disabled={isLoading || isPending}
        className={`inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-sm font-semibold shadow-sm transition-all duration-200 disabled:opacity-60 ${
          isFollowed
            ? "bg-white border border-primary text-primary hover:bg-primary-50"
            : "bg-primary text-white hover:bg-primary-dark"
        }`}
        aria-label={isFollowed ? "Ne plus suivre" : "Suivre la boutique"}
      >
        <Heart
          size={16}
          className={isFollowed ? "fill-primary text-primary" : ""}
        />
        {isFollowed ? "Suivi" : "Suivre la boutique"}
      </button>
      <span className="text-xs text-muted-foreground">
        {followerCount.toLocaleString("fr-FR")} suiveurs
      </span>
    </div>
  );
}
