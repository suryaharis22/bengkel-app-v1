/*
  Warnings:

  - You are about to drop the column `updated_at` on the `sale_items` table. All the data in the column will be lost.
  - You are about to alter the column `weight` on the `spare_part_variants` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `weight` on the `spare_parts` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(150)`.
  - You are about to alter the column `no_hp` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(30)`.

*/
-- DropIndex
DROP INDEX `sales_midtrans_transaction_id_idx` ON `sales`;

-- DropIndex
DROP INDEX `spare_parts_created_at_idx` ON `spare_parts`;

-- AlterTable
ALTER TABLE `sale_items` DROP COLUMN `updated_at`;

-- AlterTable
ALTER TABLE `sales` MODIFY `payment_status` ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid';

-- AlterTable
ALTER TABLE `spare_part_variants` MODIFY `weight` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `spare_parts` MODIFY `weight` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `username` VARCHAR(100) NOT NULL,
    MODIFY `email` VARCHAR(150) NOT NULL,
    MODIFY `no_hp` VARCHAR(30) NULL,
    MODIFY `password` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `plate_number` VARCHAR(20) NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INTEGER NULL,
    `color` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vehicles_user_id_idx`(`user_id`),
    INDEX `vehicles_plate_number_idx`(`plate_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workshop_services_status_idx`(`status`),
    INDEX `workshop_services_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_number` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NULL,
    `vehicle_id` INTEGER NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_phone` VARCHAR(30) NOT NULL,
    `complaint` TEXT NOT NULL,
    `notes` TEXT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'technician_confirmed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_bookings_booking_number_key`(`booking_number`),
    INDEX `service_bookings_customer_id_idx`(`customer_id`),
    INDEX `service_bookings_vehicle_id_idx`(`vehicle_id`),
    INDEX `service_bookings_status_idx`(`status`),
    INDEX `service_bookings_scheduled_at_idx`(`scheduled_at`),
    INDEX `service_bookings_customer_phone_idx`(`customer_phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(50) NOT NULL,
    `booking_id` INTEGER NOT NULL,
    `technician_id` INTEGER NULL,
    `confirmed_by_id` INTEGER NULL,
    `complaint` TEXT NOT NULL,
    `diagnosis` TEXT NULL,
    `notes` TEXT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(15, 2) NOT NULL,
    `payment_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `change_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `payment_status` ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    `status` ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `midtrans_order_id` VARCHAR(50) NULL,
    `midtrans_transaction_id` VARCHAR(100) NULL,
    `midtrans_payment_type` VARCHAR(50) NULL,
    `midtrans_transaction_status` VARCHAR(30) NULL,
    `confirmed_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_orders_order_number_key`(`order_number`),
    UNIQUE INDEX `service_orders_booking_id_key`(`booking_id`),
    UNIQUE INDEX `service_orders_midtrans_order_id_key`(`midtrans_order_id`),
    INDEX `service_orders_technician_id_idx`(`technician_id`),
    INDEX `service_orders_confirmed_by_id_idx`(`confirmed_by_id`),
    INDEX `service_orders_payment_status_idx`(`payment_status`),
    INDEX `service_orders_status_idx`(`status`),
    INDEX `service_orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_order_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_order_items_service_order_id_idx`(`service_order_id`),
    INDEX `service_order_items_service_id_idx`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_order_spare_parts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_order_id` INTEGER NOT NULL,
    `spare_part_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `sku` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_order_spare_parts_service_order_id_idx`(`service_order_id`),
    INDEX `service_order_spare_parts_spare_part_id_idx`(`spare_part_id`),
    INDEX `service_order_spare_parts_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_order_id` INTEGER NOT NULL,
    `payment_method` ENUM('cash', 'qris', 'transfer', 'debit', 'ewallet') NOT NULL,
    `provider` ENUM('cash', 'midtrans') NOT NULL DEFAULT 'cash',
    `amount` DECIMAL(15, 2) NOT NULL,
    `reference_number` VARCHAR(100) NULL,
    `midtrans_order_id` VARCHAR(50) NULL,
    `midtrans_transaction_id` VARCHAR(100) NULL,
    `midtrans_payment_type` VARCHAR(50) NULL,
    `midtrans_transaction_status` VARCHAR(30) NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `service_payments_service_order_id_idx`(`service_order_id`),
    INDEX `service_payments_payment_method_idx`(`payment_method`),
    INDEX `service_payments_provider_idx`(`provider`),
    INDEX `service_payments_paid_at_idx`(`paid_at`),
    INDEX `service_payments_midtrans_transaction_id_idx`(`midtrans_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `spare_part_stocks_stock_idx` ON `spare_part_stocks`(`stock`);

-- CreateIndex
CREATE INDEX `spare_part_stocks_minimum_stock_idx` ON `spare_part_stocks`(`minimum_stock`);

-- CreateIndex
CREATE INDEX `spare_parts_name_idx` ON `spare_parts`(`name`);

-- CreateIndex
CREATE INDEX `users_role_idx` ON `users`(`role`);

-- CreateIndex
CREATE INDEX `users_no_hp_idx` ON `users`(`no_hp`);

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_technician_id_fkey` FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_confirmed_by_id_fkey` FOREIGN KEY (`confirmed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_items` ADD CONSTRAINT `service_order_items_service_order_id_fkey` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_items` ADD CONSTRAINT `service_order_items_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `workshop_services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_spare_parts` ADD CONSTRAINT `service_order_spare_parts_service_order_id_fkey` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_spare_parts` ADD CONSTRAINT `service_order_spare_parts_spare_part_id_fkey` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_spare_parts` ADD CONSTRAINT `service_order_spare_parts_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `spare_part_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_payments` ADD CONSTRAINT `service_payments_service_order_id_fkey` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
