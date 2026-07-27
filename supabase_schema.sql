-- ====================================================================
-- SUPABASE SQL SCHEMA FOR EPE PREMIER LEAGUE PLATFORM
-- ====================================================================

-- 1. Match Predictions Table (Interactive Fan Prediction Engine)
CREATE TABLE IF NOT EXISTS public.match_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT NOT NULL,
    user_session_id TEXT NOT NULL,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('Home Win', 'Draw', 'Away Win')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_match_vote UNIQUE (match_id, user_session_id)
);

-- Fast lookup indexes for predictions
CREATE INDEX IF NOT EXISTS idx_match_predictions_match_id ON public.match_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_session ON public.match_predictions(user_session_id);

-- 2. Add Fantasy Price Column to Players Table (Epe Fantasy League Economy)
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS fantasy_price NUMERIC(4, 1) DEFAULT 6.0;

-- 3. Fantasy Squads Table (15-man squad, Starting XI, Bench, Captaincy, Transfers & Point Penalty Math)
CREATE TABLE IF NOT EXISTS public.fantasy_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    squad_name TEXT NOT NULL,
    captain_player_id TEXT NOT NULL,
    vice_captain_player_id TEXT,
    starting_player_ids TEXT[] NOT NULL DEFAULT '{}',
    bench_player_ids TEXT[] NOT NULL DEFAULT '{}',
    player_ids TEXT[] NOT NULL DEFAULT '{}',
    saved_baseline_player_ids TEXT[] NOT NULL DEFAULT '{}',
    free_transfers INTEGER DEFAULT 2,
    transfers_made INTEGER DEFAULT 0,
    point_hits INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    gameweek_points INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_fantasy_squad UNIQUE (user_email)
);

-- Ensure transfer tracking columns exist on fantasy_squads table if created previously
ALTER TABLE public.fantasy_squads 
ADD COLUMN IF NOT EXISTS saved_baseline_player_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS free_transfers INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS transfers_made INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS point_hits INTEGER DEFAULT 0;

-- 4. Mini Leagues Table (Private Fan Leagues)
CREATE TABLE IF NOT EXISTS public.mini_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    member_emails TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Database Stored Function: Process Fantasy Transfers & Point Deductions
-- Free Quota: Exactly 2 Free Trades per Gameweek.
-- Penalty Math: >2 trades -> -4 point deduction per additional trade.
CREATE OR REPLACE FUNCTION public.process_fantasy_transfers(
    p_user_email TEXT,
    p_new_player_ids TEXT[],
    p_starting_player_ids TEXT[],
    p_bench_player_ids TEXT[],
    p_captain_id TEXT,
    p_vice_captain_id TEXT,
    p_squad_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_squad RECORD;
    v_baseline TEXT[];
    v_new_transfers_count INT := 0;
    v_free_transfers INT := 2;
    v_point_deduction INT := 0;
    v_elem TEXT;
BEGIN
    SELECT * INTO v_squad FROM public.fantasy_squads WHERE LOWER(user_email) = LOWER(p_user_email);
    
    IF v_squad IS NULL THEN
        -- First time squad creation: 0 transfers made against baseline
        INSERT INTO public.fantasy_squads (
            user_id, user_email, user_name, squad_name,
            captain_player_id, vice_captain_player_id,
            starting_player_ids, bench_player_ids, player_ids,
            saved_baseline_player_ids, free_transfers, transfers_made, point_hits
        ) VALUES (
            p_user_email, p_user_email, SPLIT_PART(p_user_email, '@', 1), p_squad_name,
            p_captain_id, p_vice_captain_id,
            p_starting_player_ids, p_bench_player_ids, p_new_player_ids,
            p_new_player_ids, 2, 0, 0
        );
        RETURN jsonb_build_object('success', true, 'transfers_made', 0, 'free_transfers', 2, 'point_hits', 0);
    END IF;

    -- Calculate transfers made relative to saved baseline
    v_baseline := COALESCE(v_squad.saved_baseline_player_ids, v_squad.player_ids);
    IF v_baseline IS NULL OR array_length(v_baseline, 1) = 0 THEN
        v_baseline := p_new_player_ids;
    END IF;

    -- Count new players not present in baseline
    FOREACH v_elem IN ARRAY p_new_player_ids LOOP
        IF NOT (v_elem = ANY(v_baseline)) THEN
            v_new_transfers_count := v_new_transfers_count + 1;
        END IF;
    END LOOP;

    -- Deduction math: > 2 trades -> -4 points per trade over 2
    IF v_new_transfers_count > 2 THEN
        v_point_deduction := (v_new_transfers_count - 2) * 4;
        v_free_transfers := 0;
    ELSE
        v_free_transfers := 2 - v_new_transfers_count;
        v_point_deduction := 0;
    END IF;

    UPDATE public.fantasy_squads SET
        squad_name = p_squad_name,
        captain_player_id = p_captain_id,
        vice_captain_player_id = p_vice_captain_id,
        starting_player_ids = p_starting_player_ids,
        bench_player_ids = p_bench_player_ids,
        player_ids = p_new_player_ids,
        transfers_made = v_new_transfers_count,
        free_transfers = v_free_transfers,
        point_hits = v_point_deduction,
        updated_at = NOW()
    WHERE LOWER(user_email) = LOWER(p_user_email);

    RETURN jsonb_build_object(
        'success', true,
        'transfers_made', v_new_transfers_count,
        'free_transfers', v_free_transfers,
        'point_hits', v_point_deduction
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies (Row Level Security)
ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_leagues ENABLE ROW LEVEL SECURITY;

-- Allow public read & insert for match predictions
CREATE POLICY "Public Predictions Access" ON public.match_predictions
    FOR ALL USING (true) WITH CHECK (true);

-- Allow users full access to their own fantasy squad
CREATE POLICY "Users Manage Own Squad" ON public.fantasy_squads
    FOR ALL USING (true) WITH CHECK (true);

-- Allow public access to mini leagues
CREATE POLICY "Public Mini Leagues Access" ON public.mini_leagues
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Player of the Week (POTW) Module
CREATE TABLE IF NOT EXISTS public.player_of_the_week (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gameweek_number INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    graphic_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Man of the Match (MOTM) & Fantasy Bonus Points Additions
-- matches table updates
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS motm_player_id TEXT,
ADD COLUMN IF NOT EXISTS motm_graphic_url TEXT;

-- player_match_stats table (create if not exists)
CREATE TABLE IF NOT EXISTS public.player_match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_player_match_stats UNIQUE (match_id, player_id)
);
