
CREATE OR REPLACE FUNCTION public.get_trust_scores(provider_ids UUID[] DEFAULT NULL)
RETURNS TABLE(
  service_profile_id UUID,
  trust_score INTEGER,
  completed_jobs BIGINT,
  positive_reviews BIGINT,
  complaints_count BIGINT,
  cancellations BIGINT,
  average_rating NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    sp.id AS service_profile_id,
    GREATEST(0, LEAST(100, (
      COALESCE(sp.rating, 0) * 20 +
      (SELECT COUNT(*) FROM bookings b WHERE b.service_profile_id = sp.id AND b.status = 'completed') * 2 +
      (SELECT COUNT(*) FROM reviews r WHERE r.service_profile_id = sp.id AND r.rating >= 4) * 3 -
      (SELECT COUNT(*) FROM complaints c WHERE c.service_profile_id = sp.id) * 5 -
      (SELECT COUNT(*) FROM bookings b2 WHERE b2.service_profile_id = sp.id AND b2.status = 'cancelled' AND b2.provider_user_id = sp.user_id) * 4
    )::INTEGER))::INTEGER AS trust_score,
    (SELECT COUNT(*) FROM bookings b WHERE b.service_profile_id = sp.id AND b.status = 'completed') AS completed_jobs,
    (SELECT COUNT(*) FROM reviews r WHERE r.service_profile_id = sp.id AND r.rating >= 4) AS positive_reviews,
    (SELECT COUNT(*) FROM complaints c WHERE c.service_profile_id = sp.id) AS complaints_count,
    (SELECT COUNT(*) FROM bookings b2 WHERE b2.service_profile_id = sp.id AND b2.status = 'cancelled' AND b2.provider_user_id = sp.user_id) AS cancellations,
    COALESCE(sp.rating, 0) AS average_rating
  FROM service_profiles sp
  WHERE (provider_ids IS NULL OR sp.id = ANY(provider_ids));
$$;
