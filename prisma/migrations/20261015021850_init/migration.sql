-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'teknisi', 'customer');

-- CreateEnum
CREATE TYPE "SparePartStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "SalePaymentStatus" AS ENUM ('unpaid', 'partial', 'paid', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'qris', 'transfer', 'debit', 'ewallet');

-- CreateEnum
CREATE TYPE "ServiceBookingStatus" AS ENUM ('pending', 'confirmed', 'technician_confirmed', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ServicePaymentStatus" AS ENUM ('unpaid', 'partial', 'paid', 'refunded');

-- CreateEnum
CREATE TYPE "ServicePaymentProvider" AS ENUM ('cash', 'midtrans');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "no_hp" VARCHAR(30),
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "plate_number" VARCHAR(20) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER,
    "color" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_part_categories" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_part_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "logo_url" VARCHAR(255),
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_parts" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "part_number" VARCHAR(100),
    "description" TEXT,
    "short_description" VARCHAR(255),
    "price" DECIMAL(15,2) NOT NULL,
    "compare_price" DECIMAL(15,2),
    "cost_price" DECIMAL(15,2),
    "weight" DECIMAL(10,2),
    "status" "SparePartStatus" NOT NULL DEFAULT 'draft',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_part_images" (
    "id" SERIAL NOT NULL,
    "spare_part_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spare_part_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_part_variants" (
    "id" SERIAL NOT NULL,
    "spare_part_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "compare_price" DECIMAL(15,2),
    "cost_price" DECIMAL(15,2),
    "weight" DECIMAL(10,2),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_part_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_part_stocks" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved_stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_part_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "cashier_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "customer_name" VARCHAR(100),
    "customer_phone" VARCHAR(30),
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(15,2) NOT NULL,
    "payment_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "change_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_status" "SalePaymentStatus" NOT NULL DEFAULT 'unpaid',
    "status" "SaleStatus" NOT NULL DEFAULT 'completed',
    "midtrans_order_id" VARCHAR(50),
    "midtrans_transaction_id" VARCHAR(100),
    "midtrans_payment_type" VARCHAR(50),
    "midtrans_transaction_status" VARCHAR(30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference_number" VARCHAR(100),
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_services" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_bookings" (
    "id" SERIAL NOT NULL,
    "booking_number" VARCHAR(50) NOT NULL,
    "customer_id" INTEGER,
    "vehicle_id" INTEGER NOT NULL,
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_phone" VARCHAR(30) NOT NULL,
    "complaint" TEXT NOT NULL,
    "notes" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "ServiceBookingStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" SERIAL NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "technician_id" INTEGER,
    "confirmed_by_id" INTEGER,
    "complaint" TEXT NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(15,2) NOT NULL,
    "payment_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "change_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_status" "ServicePaymentStatus" NOT NULL DEFAULT 'unpaid',
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'pending',
    "midtrans_order_id" VARCHAR(50),
    "midtrans_transaction_id" VARCHAR(100),
    "midtrans_payment_type" VARCHAR(50),
    "midtrans_transaction_status" VARCHAR(30),
    "confirmed_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_items" (
    "id" SERIAL NOT NULL,
    "service_order_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_spare_parts" (
    "id" SERIAL NOT NULL,
    "service_order_id" INTEGER NOT NULL,
    "spare_part_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_payments" (
    "id" SERIAL NOT NULL,
    "service_order_id" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "provider" "ServicePaymentProvider" NOT NULL DEFAULT 'cash',
    "amount" DECIMAL(15,2) NOT NULL,
    "reference_number" VARCHAR(100),
    "midtrans_order_id" VARCHAR(50),
    "midtrans_transaction_id" VARCHAR(100),
    "midtrans_payment_type" VARCHAR(50),
    "midtrans_transaction_status" VARCHAR(30),
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_no_hp_idx" ON "users"("no_hp");

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- CreateIndex
CREATE INDEX "vehicles_plate_number_idx" ON "vehicles"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "spare_part_categories_slug_key" ON "spare_part_categories"("slug");

-- CreateIndex
CREATE INDEX "spare_part_categories_parent_id_idx" ON "spare_part_categories"("parent_id");

-- CreateIndex
CREATE INDEX "spare_part_categories_status_idx" ON "spare_part_categories"("status");

-- CreateIndex
CREATE INDEX "spare_part_categories_sort_order_idx" ON "spare_part_categories"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_status_idx" ON "brands"("status");

-- CreateIndex
CREATE UNIQUE INDEX "spare_parts_slug_key" ON "spare_parts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "spare_parts_sku_key" ON "spare_parts"("sku");

-- CreateIndex
CREATE INDEX "spare_parts_category_id_idx" ON "spare_parts"("category_id");

-- CreateIndex
CREATE INDEX "spare_parts_brand_id_idx" ON "spare_parts"("brand_id");

-- CreateIndex
CREATE INDEX "spare_parts_status_idx" ON "spare_parts"("status");

-- CreateIndex
CREATE INDEX "spare_parts_is_featured_idx" ON "spare_parts"("is_featured");

-- CreateIndex
CREATE INDEX "spare_parts_name_idx" ON "spare_parts"("name");

-- CreateIndex
CREATE INDEX "spare_part_images_spare_part_id_idx" ON "spare_part_images"("spare_part_id");

-- CreateIndex
CREATE INDEX "spare_part_images_sort_order_idx" ON "spare_part_images"("sort_order");

-- CreateIndex
CREATE INDEX "spare_part_images_is_primary_idx" ON "spare_part_images"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "spare_part_variants_sku_key" ON "spare_part_variants"("sku");

-- CreateIndex
CREATE INDEX "spare_part_variants_spare_part_id_idx" ON "spare_part_variants"("spare_part_id");

-- CreateIndex
CREATE INDEX "spare_part_variants_status_idx" ON "spare_part_variants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "spare_part_stocks_variant_id_key" ON "spare_part_stocks"("variant_id");

-- CreateIndex
CREATE INDEX "spare_part_stocks_stock_idx" ON "spare_part_stocks"("stock");

-- CreateIndex
CREATE INDEX "spare_part_stocks_minimum_stock_idx" ON "spare_part_stocks"("minimum_stock");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoice_number_key" ON "sales"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_midtrans_order_id_key" ON "sales"("midtrans_order_id");

-- CreateIndex
CREATE INDEX "sales_cashier_id_idx" ON "sales"("cashier_id");

-- CreateIndex
CREATE INDEX "sales_customer_id_idx" ON "sales"("customer_id");

-- CreateIndex
CREATE INDEX "sales_payment_status_idx" ON "sales"("payment_status");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_variant_id_idx" ON "sale_items"("variant_id");

-- CreateIndex
CREATE INDEX "sale_payments_sale_id_idx" ON "sale_payments"("sale_id");

-- CreateIndex
CREATE INDEX "sale_payments_payment_method_idx" ON "sale_payments"("payment_method");

-- CreateIndex
CREATE INDEX "sale_payments_paid_at_idx" ON "sale_payments"("paid_at");

-- CreateIndex
CREATE INDEX "workshop_services_status_idx" ON "workshop_services"("status");

-- CreateIndex
CREATE INDEX "workshop_services_name_idx" ON "workshop_services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_bookings_booking_number_key" ON "service_bookings"("booking_number");

-- CreateIndex
CREATE INDEX "service_bookings_customer_id_idx" ON "service_bookings"("customer_id");

-- CreateIndex
CREATE INDEX "service_bookings_vehicle_id_idx" ON "service_bookings"("vehicle_id");

-- CreateIndex
CREATE INDEX "service_bookings_status_idx" ON "service_bookings"("status");

-- CreateIndex
CREATE INDEX "service_bookings_scheduled_at_idx" ON "service_bookings"("scheduled_at");

-- CreateIndex
CREATE INDEX "service_bookings_customer_phone_idx" ON "service_bookings"("customer_phone");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_order_number_key" ON "service_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_booking_id_key" ON "service_orders"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_midtrans_order_id_key" ON "service_orders"("midtrans_order_id");

-- CreateIndex
CREATE INDEX "service_orders_technician_id_idx" ON "service_orders"("technician_id");

-- CreateIndex
CREATE INDEX "service_orders_confirmed_by_id_idx" ON "service_orders"("confirmed_by_id");

-- CreateIndex
CREATE INDEX "service_orders_payment_status_idx" ON "service_orders"("payment_status");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_created_at_idx" ON "service_orders"("created_at");

-- CreateIndex
CREATE INDEX "service_order_items_service_order_id_idx" ON "service_order_items"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_items_service_id_idx" ON "service_order_items"("service_id");

-- CreateIndex
CREATE INDEX "service_order_spare_parts_service_order_id_idx" ON "service_order_spare_parts"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_spare_parts_spare_part_id_idx" ON "service_order_spare_parts"("spare_part_id");

-- CreateIndex
CREATE INDEX "service_order_spare_parts_variant_id_idx" ON "service_order_spare_parts"("variant_id");

-- CreateIndex
CREATE INDEX "service_payments_service_order_id_idx" ON "service_payments"("service_order_id");

-- CreateIndex
CREATE INDEX "service_payments_payment_method_idx" ON "service_payments"("payment_method");

-- CreateIndex
CREATE INDEX "service_payments_provider_idx" ON "service_payments"("provider");

-- CreateIndex
CREATE INDEX "service_payments_paid_at_idx" ON "service_payments"("paid_at");

-- CreateIndex
CREATE INDEX "service_payments_midtrans_transaction_id_idx" ON "service_payments"("midtrans_transaction_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_part_categories" ADD CONSTRAINT "spare_part_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "spare_part_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "spare_part_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_part_images" ADD CONSTRAINT "spare_part_images_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_part_variants" ADD CONSTRAINT "spare_part_variants_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_part_stocks" ADD CONSTRAINT "spare_part_stocks_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "spare_part_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "spare_part_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "service_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "workshop_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_spare_parts" ADD CONSTRAINT "service_order_spare_parts_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_spare_parts" ADD CONSTRAINT "service_order_spare_parts_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_spare_parts" ADD CONSTRAINT "service_order_spare_parts_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "spare_part_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_payments" ADD CONSTRAINT "service_payments_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
