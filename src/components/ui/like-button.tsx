"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  trackId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  onLikeChange?: (isLiked: boolean) => void;
}

export const LikeButton = ({ trackId, size = "md", className, onLikeChange }: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const res = await fetch(`/api/me/likes/${trackId}`, {
          method: "HEAD",
          credentials: "include",
        });
        
        if (res.status === 204) {
          const liked = res.headers.get('X-Liked') === 'true';
          setIsLiked(liked);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };
    checkLikeStatus();
  }, [trackId]);

  const toggleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const method = isLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/me/likes/${trackId}`, {
        method,
        credentials: "include",
      });

      if (res.ok || res.status === 201) {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        onLikeChange?.(newLikedState);
        toast.success(newLikedState ? "Added to Liked Songs" : "Removed from Liked Songs");
      } else if (res.status === 401) {
        toast.error("Please log in to like songs");
      } else {
        toast.error("Failed to update like status");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={cn(
        "transition-colors hover:scale-110 disabled:opacity-50",
        isLiked ? "text-[#1db954]" : "text-white/70 hover:text-white",
        className
      )}
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <Heart className={cn(sizeClasses[size], isLiked && "fill-current")} />
    </button>
  );
};