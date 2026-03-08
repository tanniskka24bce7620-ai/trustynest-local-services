
-- Table to store monthly winners (hall of fame)
CREATE TABLE public.monthly_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_profile_id uuid NOT NULL REFERENCES public.service_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  provider_name text NOT NULL DEFAULT '',
  service_type text NOT NULL DEFAULT '',
  photo_url text DEFAULT '',
  month_year text NOT NULL,
  rank integer NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  average_rating numeric NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  positive_reviews integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_year, rank)
);

ALTER TABLE public.monthly_winners ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard
CREATE POLICY "Anyone can view monthly winners"
  ON public.monthly_winners FOR SELECT
  USING (true);

-- DB function to compute current month leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(result_limit integer DEFAULT 10)
RETURNS TABLE(
  service_profile_id uuid,
  user_id uuid,
  provider_name text,
  service_type text,
  photo_url text,
  average_rating numeric,
  jobs_completed bigint,
  positive_reviews bigint,
  score numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH provider_stats AS (
    SELECT
      sp.id AS service_profile_id,
      sp.user_id,
      p.name AS provider_name,
      sp.service_type,
      COALESCE(p.photo_url, '') AS photo_url,
      COALESCE(sp.rating, 0) AS average_rating,
      (SELECT COUNT(*) FROM bookings b
        WHERE b.service_profile_id = sp.id
        AND b.status = 'completed'
        AND b.booking_date >= date_trunc('month', CURRENT_DATE)::date
      ) AS jobs_completed,
      (SELECT COUNT(*) FROM reviews r
        WHERE r.service_profile_id = sp.id
        AND r.rating >= 4
        AND r.created_at >= date_trunc('month', CURRENT_DATE)
      ) AS positive_reviews
    FROM service_profiles sp
    JOIN profiles p ON p.user_id = sp.user_id
    WHERE sp.available = true
  )
  SELECT
    ps.service_profile_id,
    ps.user_id,
    ps.provider_name,
    ps.service_type,
    ps.photo_url,
    ps.average_rating,
    ps.jobs_completed,
    ps.positive_reviews,
    (ps.average_rating * 50 + ps.jobs_completed * 5 + ps.positive_reviews * 10)::numeric AS score,
    ROW_NUMBER() OVER (ORDER BY (ps.average_rating * 50 + ps.jobs_completed * 5 + ps.positive_reviews * 10) DESC, ps.average_rating DESC) AS rank
  FROM provider_stats ps
  WHERE (ps.average_rating * 50 + ps.jobs_completed * 5 + ps.positive_reviews * 10) > 0
  ORDER BY score DESC
  LIMIT result_limit;
$$;
