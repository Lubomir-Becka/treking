CREATE TABLE "login_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "login_rate_limits_expires_at_idx" ON "login_rate_limits" USING btree ("expires_at");