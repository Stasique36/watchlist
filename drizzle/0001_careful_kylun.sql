CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TABLE "watchlist_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"watched" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watchlist_item" ADD CONSTRAINT "watchlist_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_item_userId_tmdbId_mediaType_uidx" ON "watchlist_item" USING btree ("user_id","tmdb_id","media_type");