-- JAGAL FC / Neon PostgreSQL schema
-- Club: 438867 | Platform: common-gen5

create extension if not exists pgcrypto;

create table if not exists club_snapshots (id uuid primary key default gen_random_uuid(), club_id text not null, platform text not null, payload jsonb not null, created_at timestamptz not null default now());
create index if not exists club_snapshots_club_created_idx on club_snapshots (club_id, created_at desc);

create table if not exists players (id uuid primary key default gen_random_uuid(), club_id text not null default '438867', ea_player_id text, ea_name text not null, display_name text, position text, jersey_number integer, status text not null default 'active', avatar_url text, profile jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index if not exists players_ea_player_id_uidx on players (ea_player_id) where ea_player_id is not null;

create table if not exists matches (id uuid primary key default gen_random_uuid(), ea_match_id text, club_id text not null, platform text not null, match_type text, played_at timestamptz, opponent_name text, opponent_id text, goals_for integer not null default 0, goals_against integer not null default 0, result text, dnf boolean not null default false, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create unique index if not exists matches_ea_match_uidx on matches (ea_match_id) where ea_match_id is not null;

create table if not exists match_players (id uuid primary key default gen_random_uuid(), match_id uuid references matches(id) on delete cascade, ea_match_id text, ea_player_id text, player_name text, position text, rating numeric, goals integer not null default 0, assists integer not null default 0, shots integer not null default 0, passes_made integer not null default 0, pass_attempts integer not null default 0, tackles_made integer not null default 0, tackle_attempts integer not null default 0, saves integer not null default 0, clean_sheet integer not null default 0, man_of_the_match integer not null default 0, red_cards integer not null default 0, seconds_played integer not null default 0, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create index if not exists match_players_match_idx on match_players (match_id);

create table if not exists trial_applications (id uuid primary key default gen_random_uuid(), name text not null, ea_id text not null, country text, primary_position text, secondary_position text, buying_fc27_day_one boolean, purchase_date text, previous_club text, message text, status text not null default 'pending', created_at timestamptz not null default now());

create table if not exists news (id uuid primary key default gen_random_uuid(), title text not null, category text, excerpt text, content text, cover_image text, published boolean not null default false, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists sync_runs (id uuid primary key default gen_random_uuid(), club_id text not null, platform text not null, status text not null, records_saved integer not null default 0, error_message text, started_at timestamptz not null default now(), finished_at timestamptz);
