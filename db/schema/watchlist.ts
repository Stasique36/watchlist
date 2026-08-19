import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const watchlistItem = pgTable(
  "watchlist_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    watched: boolean("watched").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("watchlist_item_userId_tmdbId_mediaType_uidx").on(
      table.userId,
      table.tmdbId,
      table.mediaType,
    ),
  ],
);

export const watchlistItemRelations = relations(watchlistItem, ({ one }) => ({
  user: one(user, {
    fields: [watchlistItem.userId],
    references: [user.id],
  }),
}));
