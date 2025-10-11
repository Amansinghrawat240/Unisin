import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Minimal demo dataset (aligned with homepage sections)
const demoArtists = [
  { name: "Kendrick Lamar", image_url: "/vercel.svg" },
  { name: "Drake", image_url: "/vercel.svg" },
  { name: "The Weeknd", image_url: "/vercel.svg" },
  { name: "Taylor Swift", image_url: "/vercel.svg" },
];

const demoTracks = [
  { title: "ErrTime", artist_names: ["Cardi B"], explicit: true, popularity: 92, image_url: "/vercel.svg" },
  { title: "WHERE IS MY HUSBAND!", artist_names: ["RAYE"], explicit: false, popularity: 88, image_url: "/vercel.svg" },
  { title: "Wish (feat. Trippie Redd)", artist_names: ["Diplo", "Trippie Redd"], explicit: true, popularity: 86, image_url: "/vercel.svg" },
  { title: "Moon (Feat. Bon Iver)", artist_names: ["Daniel Caesar", "Bon Iver"], explicit: false, popularity: 83, image_url: "/vercel.svg" },
];

const SCHEMA_SQL = `
-- Run this in Supabase SQL editor if tables are missing
create table if not exists artists (
  id bigserial primary key,
  name text not null unique,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists albums (
  id bigserial primary key,
  title text not null,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists tracks (
  id bigserial primary key,
  title text not null,
  album_id bigint references albums(id) on delete set null,
  explicit boolean default false,
  popularity int default 0,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists track_artists (
  track_id bigint references tracks(id) on delete cascade,
  artist_id bigint references artists(id) on delete cascade,
  primary key (track_id, artist_id)
);

create table if not exists playlists (
  id bigserial primary key,
  name text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists playlist_tracks (
  playlist_id bigint references playlists(id) on delete cascade,
  track_id bigint references tracks(id) on delete cascade,
  position int default 0,
  primary key (playlist_id, track_id)
);
`;

async function tableExists(table: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from(table as any).select("id").limit(1);
  if (error) return false;
  return true;
}

export async function POST() {
  const sb = supabaseAdmin();

  // Check if required tables exist; if not, return SQL to create them
  const required = [
    "artists",
    "albums",
    "tracks",
    "track_artists",
    "playlists",
    "playlist_tracks",
  ];

  const checks = await Promise.all(required.map((t) => tableExists(t)));
  const missing = required.filter((_, i) => !checks[i]);

  if (missing.length) {
    return NextResponse.json(
      {
        ok: false,
        message: `Missing tables: ${missing.join(", ")}. Run the returned SQL in Supabase, then re-run this endpoint.`,
        sql: SCHEMA_SQL,
      },
      { status: 400 }
    );
  }

  // Upsert artists
  for (const a of demoArtists) {
    await sb.from("artists").upsert({ name: a.name, image_url: a.image_url }, {
      onConflict: "name",
    });
  }

  // Ensure or create a generic album per track (for artwork)
  const albumTitle = "Demo Singles";
  const { data: existingAlbum } = await sb
    .from("albums")
    .select("id, title")
    .eq("title", albumTitle)
    .maybeSingle();

  let albumId = existingAlbum?.id as number | undefined;
  if (!albumId) {
    const { data: newAlbum } = await sb
      .from("albums")
      .insert({ title: albumTitle, image_url: demoTracks[0]?.image_url ?? null })
      .select("id")
      .single();
    albumId = newAlbum?.id as number;
  }

  // Insert tracks and link artists
  for (const t of demoTracks) {
    const { data: trackRow } = await sb
      .from("tracks")
      .upsert(
        { title: t.title, album_id: albumId ?? null, explicit: t.explicit, popularity: t.popularity, image_url: t.image_url },
        { onConflict: "title" }
      )
      .select("id")
      .single();

    const trackId = trackRow?.id as number | undefined;
    if (!trackId) continue;

    // Link artists (create missing artists by name)
    for (const artistName of t.artist_names) {
      const { data: artist } = await sb
        .from("artists")
        .upsert({ name: artistName }, { onConflict: "name" })
        .select("id")
        .single();

      const artistId = artist?.id as number | undefined;
      if (!artistId) continue;

      await sb
        .from("track_artists")
        .upsert({ track_id: trackId, artist_id: artistId });
    }
  }

  // Create demo playlists
  const playlists = [
    { name: "Editorial Picks", description: "Handpicked trending songs" },
    { name: "Trending Now", description: "What everyone is playing" },
  ];

  const playlistIds: number[] = [];
  for (const p of playlists) {
    const { data: pl } = await sb
      .from("playlists")
      .upsert({ name: p.name, description: p.description }, { onConflict: "name" })
      .select("id")
      .single();
    if (pl?.id) playlistIds.push(pl.id as number);
  }

  // Add all tracks to playlists
  const { data: allTracks } = await sb.from("tracks").select("id, title").order("popularity", { ascending: false });
  if (allTracks?.length && playlistIds.length) {
    for (const pid of playlistIds) {
      let position = 0;
      for (const tr of allTracks) {
        await sb
          .from("playlist_tracks")
          .upsert({ playlist_id: pid, track_id: tr.id as number, position });
        position += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, message: "Supabase seeded successfully" });
}