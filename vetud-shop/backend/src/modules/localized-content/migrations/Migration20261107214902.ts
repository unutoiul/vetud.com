import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107214902 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "localized_content_bundle" drop constraint if exists "localized_content_bundle_locale_unique";`);
    this.addSql(`create table if not exists "localized_content_bundle" ("id" text not null, "locale" text not null, "source_hash" text not null, "sources" jsonb not null, "translations" jsonb not null, "public_translations" jsonb not null, "entry_count" integer not null, "review" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "localized_content_bundle_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_localized_content_bundle_locale_unique" ON "localized_content_bundle" ("locale") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_localized_content_bundle_deleted_at" ON "localized_content_bundle" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "localized_content_bundle" cascade;`);
  }

}
