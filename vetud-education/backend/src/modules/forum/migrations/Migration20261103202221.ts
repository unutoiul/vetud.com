import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261103202221 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "forum_image" ("id" text not null, "author_id" text not null, "post_id" text null, "file_id" text not null, "url" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "forum_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_image_author_id" ON "forum_image" ("author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_image_post_id" ON "forum_image" ("post_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_image_deleted_at" ON "forum_image" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "forum_image" cascade;`);
  }

}
