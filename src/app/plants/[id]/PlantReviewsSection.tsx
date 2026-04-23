"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReviewUser = {
  id: string;
  name: string;
};

type ReviewItem = {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  photoUrls: string[];
  user: ReviewUser;
};

type ReviewResponse = {
  reviews: ReviewItem[];
  stats: {
    count: number;
    averageRating: number;
  };
  eligibility: {
    signedIn: boolean;
    hasPurchased: boolean;
    hasReviewed: boolean;
    canReview: boolean;
  };
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.56 6.09 20.66l1.13-6.57-4.77-4.65 6.6-.96L12 2.5z"
        className={filled ? "fill-amber-400" : "fill-zinc-200"}
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} filled={value <= rounded} />
      ))}
    </div>
  );
}

export function PlantReviewsSection({ plantId }: { plantId: string }) {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [response, setResponse] = useState<ReviewResponse>({
    reviews: [],
    stats: { count: 0, averageRating: 0 },
    eligibility: {
      signedIn: false,
      hasPurchased: false,
      hasReviewed: false,
      canReview: false,
    },
  });

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/reviews?plantId=${encodeURIComponent(plantId)}&includeMeta=1`, {
      cache: "no-store",
    });

    if (!res.ok) {
      setLoading(false);
      setError("Could not load reviews right now.");
      return;
    }

    const data = (await res.json()) as ReviewResponse;
    setResponse(data);
    setLoading(false);
  }, [plantId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews, status]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    return response.eligibility.canReview;
  }, [response.eligibility.canReview, submitting]);

  async function submitReview() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plantId,
        rating,
        comment: comment.trim() || undefined,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setSubmitting(false);
      setError(payload.error ?? "Unable to submit review.");
      return;
    }

    setRating(5);
    setComment("");
    setMessage("Thanks for your feedback.");
    await loadReviews();
    setSubmitting(false);
  }

  return (
    <section className="mt-14 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-emerald-950">Reviews</h2>
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <Stars rating={response.stats.averageRating} />
          <span>
            {response.stats.averageRating.toFixed(1)} / 5 ({response.stats.count})
          </span>
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-zinc-500">Loading reviews...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <>
          {!response.reviews.length ? (
            <p className="mt-4 text-sm text-zinc-500">No reviews yet. Be the first to rate this plant.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {response.reviews.map((review) => (
                <li key={review._id} className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-zinc-900">{review.user.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Stars rating={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{review.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
            <h3 className="text-base font-semibold text-emerald-950">Write a review</h3>

            {!response.eligibility.signedIn ? (
              <p className="mt-2 text-sm text-zinc-700">
                Please <Link href="/login" className="text-emerald-700 underline">sign in</Link> to review.
              </p>
            ) : null}

            {response.eligibility.signedIn && !response.eligibility.hasPurchased ? (
              <p className="mt-2 text-sm text-zinc-700">
                You can review this plant after you purchase it.
              </p>
            ) : null}

            {response.eligibility.signedIn && response.eligibility.hasReviewed ? (
              <p className="mt-2 text-sm text-zinc-700">You already reviewed this plant.</p>
            ) : null}

            {response.eligibility.canReview ? (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-zinc-700" htmlFor="rating">
                  Star rating
                </label>
                <div className="flex items-center gap-2" id="rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded-md p-1 hover:bg-zinc-100"
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    >
                      <Star filled={value <= rating} />
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-zinc-700" htmlFor="comment">
                  Comment
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your experience with this plant"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring"
                />

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={!canSubmit}
                  className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit review"}
                </button>
              </div>
            ) : null}

            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
