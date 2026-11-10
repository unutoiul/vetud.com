import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261105175920 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "forum_thread" add column if not exists "topic" text not null default 'general';`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_forum_thread_topic" ON "forum_thread" ("topic") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_forum_thread_topic";`);
    this.addSql(`alter table if exists "forum_thread" drop column if exists "topic";`);
  }

}
