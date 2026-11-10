import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261103204454 extends Migration {

  override async up(): Promise<void> {
    // Research logs were removed from the community: delete them with everything attached to them,
    // before the kind check below rejects them.
    this.addSql(`delete from "forum_vote" where "post_id" in (select p."id" from "forum_post" p join "forum_thread" t on t."id" = p."thread_id" where t."kind" = 'research_log');`);
    this.addSql(`delete from "forum_report" where "post_id" in (select p."id" from "forum_post" p join "forum_thread" t on t."id" = p."thread_id" where t."kind" = 'research_log');`);
    this.addSql(`delete from "forum_image" where "post_id" in (select p."id" from "forum_post" p join "forum_thread" t on t."id" = p."thread_id" where t."kind" = 'research_log');`);
    this.addSql(`delete from "forum_post" where "thread_id" in (select "id" from "forum_thread" where "kind" = 'research_log');`);
    this.addSql(`delete from "forum_thread" where "kind" = 'research_log';`);

    this.addSql(`drop table if exists "forum_log_measurement" cascade;`);

    this.addSql(`alter table if exists "forum_thread" drop constraint if exists "forum_thread_kind_check";`);

    this.addSql(`alter table if exists "forum_post" drop column if exists "kind", drop column if exists "week";`);

    this.addSql(`alter table if exists "forum_thread" drop column if exists "other_peptides", drop column if exists "unit_system", drop column if exists "side_effects", drop column if exists "exclude_from_insights";`);

    this.addSql(`alter table if exists "forum_thread" add constraint "forum_thread_kind_check" check("kind" in ('discussion', 'question'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "forum_log_measurement" ("id" text not null, "thread_id" text not null, "post_id" text null, "metric" text not null, "week" integer not null, "value" real not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_log_measurement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_log_measurement_deleted_at" ON "forum_log_measurement" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_forum_log_measurement_thread_metric_week" ON "forum_log_measurement" ("thread_id", "metric", "week") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "forum_thread" drop constraint if exists "forum_thread_kind_check";`);

    this.addSql(`alter table if exists "forum_post" add column if not exists "kind" text check ("kind" in ('post', 'check_in')) not null default 'post', add column if not exists "week" integer null;`);

    this.addSql(`alter table if exists "forum_thread" add column if not exists "other_peptides" text[] null, add column if not exists "unit_system" text check ("unit_system" in ('metric', 'imperial')) not null default 'metric', add column if not exists "side_effects" text[] null, add column if not exists "exclude_from_insights" boolean not null default false;`);
    this.addSql(`alter table if exists "forum_thread" add constraint "forum_thread_kind_check" check("kind" in ('discussion', 'question', 'research_log'));`);
  }

}
