import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261103132920 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "forum_log_measurement" ("id" text not null, "thread_id" text not null, "post_id" text null, "metric" text not null, "week" integer not null, "value" real not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_log_measurement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_log_measurement_deleted_at" ON "forum_log_measurement" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_forum_log_measurement_thread_metric_week" ON "forum_log_measurement" ("thread_id", "metric", "week") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "forum_post" ("id" text not null, "thread_id" text not null, "author_id" text not null, "body" text not null, "is_opening" boolean not null default false, "kind" text check ("kind" in ('post', 'check_in')) not null default 'post', "week" integer null, "status" text check ("status" in ('published', 'pending', 'hidden', 'removed')) not null default 'published', "hold_reason" text null, "helpful_count" integer not null default 0, "edited_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_post_thread_id" ON "forum_post" ("thread_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_post_author_id" ON "forum_post" ("author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_post_deleted_at" ON "forum_post" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "forum_profile" ("id" text not null, "customer_id" text not null, "display_name" text not null, "handle" text not null, "role" text check ("role" in ('member', 'expert', 'moderator')) not null default 'member', "credentials" text null, "bio" text null, "reputation" integer not null default 0, "status" text check ("status" in ('active', 'muted', 'banned')) not null default 'active', "guidelines_accepted_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_forum_profile_customer_id" ON "forum_profile" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_forum_profile_handle" ON "forum_profile" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_profile_deleted_at" ON "forum_profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "forum_report" ("id" text not null, "post_id" text not null, "reporter_id" text not null, "reason" text check ("reason" in ('dose', 'medical_claim', 'spam', 'abuse', 'other')) not null, "note" text null, "status" text check ("status" in ('open', 'resolved')) not null default 'open', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_report_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_report_deleted_at" ON "forum_report" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_forum_report_post_reporter" ON "forum_report" ("post_id", "reporter_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "forum_thread" ("id" text not null, "author_id" text not null, "kind" text check ("kind" in ('discussion', 'question', 'research_log')) not null, "title" text not null, "slug" text not null, "excerpt" text not null, "peptide_slug" text null, "other_peptides" text[] null, "product_handle" text null, "lot" text null, "verified_purchase" boolean not null default false, "status" text check ("status" in ('published', 'pending', 'hidden', 'removed')) not null default 'published', "hold_reason" text null, "pinned" boolean not null default false, "locked" boolean not null default false, "accepted_post_id" text null, "reply_count" integer not null default 0, "helpful_count" integer not null default 0, "last_activity_at" timestamptz not null, "unit_system" text check ("unit_system" in ('metric', 'imperial')) not null default 'metric', "side_effects" text[] null, "exclude_from_insights" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_thread_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_thread_author_id" ON "forum_thread" ("author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_thread_peptide_slug" ON "forum_thread" ("peptide_slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_thread_lot" ON "forum_thread" ("lot") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_thread_deleted_at" ON "forum_thread" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "forum_vote" ("id" text not null, "post_id" text not null, "profile_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_vote_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_vote_profile_id" ON "forum_vote" ("profile_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_vote_deleted_at" ON "forum_vote" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_forum_vote_post_profile" ON "forum_vote" ("post_id", "profile_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "forum_log_measurement" cascade;`);

    this.addSql(`drop table if exists "forum_post" cascade;`);

    this.addSql(`drop table if exists "forum_profile" cascade;`);

    this.addSql(`drop table if exists "forum_report" cascade;`);

    this.addSql(`drop table if exists "forum_thread" cascade;`);

    this.addSql(`drop table if exists "forum_vote" cascade;`);
  }

}
