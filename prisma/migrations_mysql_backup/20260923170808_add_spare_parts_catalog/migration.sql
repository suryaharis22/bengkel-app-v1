-- CreateTable
CREATE TABLE `spare_part_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spare_part_categories_slug_key`(`slug`),
    INDEX `spare_part_categories_parent_id_idx`(`parent_id`),
    INDEX `spare_part_categories_status_idx`(`status`),
    INDEX `spare_part_categories_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `brands_name_key`(`name`),
    UNIQUE INDEX `brands_slug_key`(`slug`),
    INDEX `brands_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_parts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `brand_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `sku` VARCHAR(50) NOT NULL,
    `part_number` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `short_description` VARCHAR(255) NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `compare_price` DECIMAL(15, 2) NULL,
    `cost_price` DECIMAL(15, 2) NULL,
    `weight` INTEGER NULL,
    `status` ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spare_parts_slug_key`(`slug`),
    UNIQUE INDEX `spare_parts_sku_key`(`sku`),
    INDEX `spare_parts_category_id_idx`(`category_id`),
    INDEX `spare_parts_brand_id_idx`(`brand_id`),
    INDEX `spare_parts_status_idx`(`status`),
    INDEX `spare_parts_is_featured_idx`(`is_featured`),
    INDEX `spare_parts_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_part_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spare_part_id` INTEGER NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `spare_part_images_spare_part_id_idx`(`spare_part_id`),
    INDEX `spare_part_images_is_primary_idx`(`is_primary`),
    INDEX `spare_part_images_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_part_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spare_part_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `sku` VARCHAR(50) NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `compare_price` DECIMAL(15, 2) NULL,
    `cost_price` DECIMAL(15, 2) NULL,
    `weight` INTEGER NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spare_part_variants_sku_key`(`sku`),
    INDEX `spare_part_variants_spare_part_id_idx`(`spare_part_id`),
    INDEX `spare_part_variants_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_part_stocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variant_id` INTEGER NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `reserved_stock` INTEGER NOT NULL DEFAULT 0,
    `minimum_stock` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spare_part_stocks_variant_id_key`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `spare_part_categories` ADD CONSTRAINT `spare_part_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `spare_part_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_parts` ADD CONSTRAINT `spare_parts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `spare_part_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_parts` ADD CONSTRAINT `spare_parts_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_part_images` ADD CONSTRAINT `spare_part_images_spare_part_id_fkey` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_part_variants` ADD CONSTRAINT `spare_part_variants_spare_part_id_fkey` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_part_stocks` ADD CONSTRAINT `spare_part_stocks_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `spare_part_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
