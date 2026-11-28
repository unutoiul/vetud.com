import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261125015836 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "beslimnow_subscribers" drop constraint if exists "beslimnow_subscribers_email_unique";`,
    )
    this.addSql(
      `alter table if exists "beslimnow_orders" drop constraint if exists "beslimnow_orders_order_number_unique";`,
    )
    this.addSql(
      `create table if not exists "beslimnow_orders" ("id" text not null, "source" text not null default 'beslimnow', "order_number" text not null, "placed_at" timestamptz not null, "status" text check ("status" in ('awaiting_payment', 'paid', 'shipped', 'cancelled')) not null default 'awaiting_payment', "product" text check ("product" in ('tz2', 'retatrutide')) not null, "strength" text not null, "quantity" integer not null, "currency" text not null, "unit_regular" numeric not null, "unit_price" numeric not null, "regular_total" numeric not null, "subtotal" numeric not null, "code_discount" numeric not null, "total" numeric not null, "promo_code" text null, "name" text not null, "email" text not null, "phone" text not null, "contact_app" text not null, "contact_handle" text null, "country" text not null, "address" text not null, "city" text not null, "postal_code" text not null, "note" text null, "research_use_confirmed" boolean not null, "confirmation_sent" boolean not null default false, "raw_unit_regular" jsonb not null, "raw_unit_price" jsonb not null, "raw_regular_total" jsonb not null, "raw_subtotal" jsonb not null, "raw_code_discount" jsonb not null, "raw_total" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "beslimnow_orders_pkey" primary key ("id"));`,
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_beslimnow_orders_order_number_unique" ON "beslimnow_orders" ("order_number") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_beslimnow_orders_deleted_at" ON "beslimnow_orders" ("deleted_at") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_beslimnow_orders_placed_at" ON "beslimnow_orders" ("placed_at") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_beslimnow_orders_email" ON "beslimnow_orders" ("email") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_beslimnow_orders_status" ON "beslimnow_orders" ("status") WHERE deleted_at IS NULL;`,
    )

    this.addSql(
      `create table if not exists "beslimnow_subscribers" ("id" text not null, "source" text not null default 'beslimnow', "email" text not null, "country" text null, "signup_form" text not null default 'promo-popup', "subscribed_at" timestamptz not null, "last_seen_at" timestamptz not null, "times_subscribed" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "beslimnow_subscribers_pkey" primary key ("id"));`,
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_beslimnow_subscribers_email_unique" ON "beslimnow_subscribers" ("email") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_beslimnow_subscribers_deleted_at" ON "beslimnow_subscribers" ("deleted_at") WHERE deleted_at IS NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "beslimnow_orders" cascade;`)

    this.addSql(`drop table if exists "beslimnow_subscribers" cascade;`)
  }
}
