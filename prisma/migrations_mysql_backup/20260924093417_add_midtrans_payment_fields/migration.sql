/*
  Warnings:

  - A unique constraint covering the columns `[midtrans_order_id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `sales` ADD COLUMN `midtrans_order_id` VARCHAR(50) NULL,
    ADD COLUMN `midtrans_payment_type` VARCHAR(50) NULL,
    ADD COLUMN `midtrans_transaction_id` VARCHAR(100) NULL,
    ADD COLUMN `midtrans_transaction_status` VARCHAR(30) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `sales_midtrans_order_id_key` ON `sales`(`midtrans_order_id`);

-- CreateIndex
CREATE INDEX `sales_midtrans_transaction_id_idx` ON `sales`(`midtrans_transaction_id`);
