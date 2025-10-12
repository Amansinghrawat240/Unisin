import { pgTable, serial, text, boolean, timestamp, integer, primaryKey, index, unique } from 'drizzle-orm/pg-core';

// Auth tables for better-auth
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified")
    .default(false)
    .notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(), // user | creator | editor | admin
  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Music catalog tables
export const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  bio: text('bio'),
  imageUrl: text('image_url'),
  bannerUrl: text('banner_url'),
  popularity: integer('popularity').default(0),
  userId: text('user_id').references(() => user.id),
  isVerified: boolean('is_verified').default(false),
  monthlyListeners: integer('monthly_listeners').default(0),
  createdAt: timestamp('created_at').notNull(),
}, (table) => ({
  popularityIdx: index('artists_popularity_idx').on(table.popularity),
  userIdIdx: index('artists_user_id_idx').on(table.userId),
}));

export const albums = pgTable('albums', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').references(() => artists.id),
  title: text('title').notNull(),
  releaseDate: timestamp('release_date'),
  coverUrl: text('cover_url'),
  popularity: integer('popularity').default(0),
  createdAt: timestamp('created_at').notNull(),
}, (table) => ({
  artistIdIdx: index('albums_artist_id_idx').on(table.artistId),
  popularityIdx: index('albums_popularity_idx').on(table.popularity),
}));

export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
  albumId: integer('album_id').references(() => albums.id),
  title: text('title').notNull(),
  durationSec: integer('duration_sec').notNull(),
  audioUrl: text('audio_url').notNull(),
  imageUrl: text('image_url'),
  popularity: integer('popularity').default(0),
  explicit: boolean('explicit').default(false),
  createdAt: timestamp('created_at').notNull(),
}, (table) => ({
  albumIdIdx: index('tracks_album_id_idx').on(table.albumId),
  popularityIdx: index('tracks_popularity_idx').on(table.popularity),
}));

export const trackArtists = pgTable('track_artists', {
  trackId: integer('track_id').notNull().references(() => tracks.id),
  artistId: integer('artist_id').notNull().references(() => artists.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.trackId, table.artistId] }),
  trackIdIdx: index('track_artists_track_id_idx').on(table.trackId),
  artistIdIdx: index('track_artists_artist_id_idx').on(table.artistId),
}));

export const playlists = pgTable('playlists', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').references(() => user.id),
  title: text('title').notNull(),
  description: text('description'),
  coverUrl: text('cover_url'),
  isPublic: boolean('is_public').default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => ({
  ownerIdIdx: index('playlists_owner_id_idx').on(table.ownerId),
  isPublicIdx: index('playlists_is_public_idx').on(table.isPublic),
  createdAtIdx: index('playlists_created_at_idx').on(table.createdAt),
}));

export const playlistTracks = pgTable('playlist_tracks', {
  playlistId: integer('playlist_id').notNull().references(() => playlists.id),
  trackId: integer('track_id').notNull().references(() => tracks.id),
  position: integer('position').notNull(),
  addedBy: text('added_by').references(() => user.id),
  addedAt: timestamp('added_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.playlistId, table.trackId] }),
  playlistIdIdx: index('playlist_tracks_playlist_id_idx').on(table.playlistId),
  trackIdIdx: index('playlist_tracks_track_id_idx').on(table.trackId),
}));

export const likesTracks = pgTable('likes_tracks', {
  userId: text('user_id').notNull().references(() => user.id),
  trackId: integer('track_id').notNull().references(() => tracks.id),
  createdAt: timestamp('created_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.trackId] }),
  userIdIdx: index('likes_tracks_user_id_idx').on(table.userId),
  trackIdIdx: index('likes_tracks_track_id_idx').on(table.trackId),
}));

export const recentlyPlayed = pgTable('recently_played', {
  userId: text('user_id').notNull().references(() => user.id),
  trackId: integer('track_id').notNull().references(() => tracks.id),
  playedAt: timestamp('played_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.trackId, table.playedAt] }),
  userIdIdx: index('recently_played_user_id_idx').on(table.userId),
  playedAtIdx: index('recently_played_played_at_idx').on(table.playedAt),
}));

// Add creator management tables
export const creators = pgTable('creators', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  email: text('email').notNull(),
  country: text('country').notNull(),
  status: text('status').notNull().default('pending'),
  termsAcceptedAt: timestamp('terms_accepted_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const trackSubmissions = pgTable('track_submissions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  creatorId: integer('creator_id').references(() => creators.id),
  title: text('title').notNull(),
  artistsCsv: text('artists_csv').notNull(),
  album: text('album'),
  releaseDate: timestamp('release_date'),
  genre: text('genre'),
  explicit: boolean('explicit').default(false),
  coverUrl: text('cover_url'),
  sourceType: text('source_type').notNull(),
  originalUrl: text('original_url'),
  audioUrl: text('audio_url'),
  durationSec: integer('duration_sec'),
  bitrateKbps: integer('bitrate_kbps'),
  state: text('state').notNull().default('submitted'),
  rejectionReason: text('rejection_reason'),
  processingLog: text('processing_log'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  lastUpdate: timestamp('last_update').notNull(),
}, (table) => ({
  userIdIdx: index('track_submissions_user_id_idx').on(table.userId),
  creatorIdIdx: index('track_submissions_creator_id_idx').on(table.creatorId),
  stateIdx: index('track_submissions_state_idx').on(table.state),
  createdAtIdx: index('track_submissions_created_at_idx').on(table.createdAt),
}));

export const moderationActions = pgTable('moderation_actions', {
  id: serial('id').primaryKey(),
  trackId: integer('track_id').notNull().references(() => trackSubmissions.id),
  moderatorUserId: text('moderator_user_id').notNull().references(() => user.id),
  action: text('action').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull(),
});

// Add playlist follows table
export const playlistFollows = pgTable('playlist_follows', {
  id: serial('id').primaryKey(),
  playlistId: integer('playlist_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (table) => ({
  uniqueFollow: index('unique_playlist_follow').on(table.playlistId, table.userId),
}));

// Homepage sections and items for editorial content
export const homepageSections = pgTable('homepage_sections', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  type: text('type').notNull(),
  position: integer('position').notNull(),
  isVisible: boolean('is_visible').default(true),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const sectionItems = pgTable('section_items', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').references(() => homepageSections.id, { onDelete: 'cascade' }),
  itemType: text('item_type').notNull(),
  itemId: integer('item_id').notNull(),
  position: integer('position').notNull(),
  customDescription: text('custom_description'),
  customCoverUrl: text('custom_cover_url'),
  createdAt: timestamp('created_at').notNull(),
});

export const editorRevisions = pgTable('editor_revisions', {
  id: serial('id').primaryKey(),
  editorId: text('editor_id').references(() => user.id),
  actionType: text('action_type').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state'),
  isUndone: boolean('is_undone').default(false),
  createdAt: timestamp('created_at').notNull(),
});

export const artistFollows = pgTable('artist_follows', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  artistId: integer('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull()
}, (table) => ({
  uniqueFollow: unique('unique_artist_follow').on(table.userId, table.artistId),
}));

export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// This will trigger Drizzle to generate and push migrations to Supabase PostgreSQL
// The schema is already defined correctly in src/db/schema.ts
// We just need to ensure migrations are generated and pushed

// Keep all existing schema definitions unchanged
// ... keep all existing imports ...
// ... keep all existing table definitions ...

// This operation will:
// 1. Generate migration files from current schema
// 2. Push migrations to the configured DATABASE_URL (Supabase PostgreSQL)
// 3. Create all tables with proper indexes and constraints