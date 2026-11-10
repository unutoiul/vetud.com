import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261103131157 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "article_comment" ("id" text not null, "article_slug" text not null, "customer_id" text not null, "author_name" text not null, "body" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_comment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_comment_article_slug" ON "article_comment" ("article_slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_comment_customer_id" ON "article_comment" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_comment_deleted_at" ON "article_comment" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "article_comment" cascade;`);
  }

}
