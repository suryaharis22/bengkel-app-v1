import { prisma } from "@/lib/prisma";

const sparePartStockSelect = {
  id: true,
  variant_id: true,
  stock: true,
  reserved_stock: true,
  minimum_stock: true,
  updated_at: true,

  variant: {
    select: {
      id: true,
      name: true,
      sku: true,

      spare_part: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
};

export async function findSparePartVariantById(id) {
  return prisma.sparePartVariant.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      status: true,

      spare_part: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function findSparePartStockByVariantId(variantId) {
  return prisma.sparePartStock.findUnique({
    where: {
      variant_id: variantId,
    },
    select: sparePartStockSelect,
  });
}

export async function createSparePartStock(variantId) {
  return prisma.sparePartStock.create({
    data: {
      variant_id: variantId,
      stock: 0,
      reserved_stock: 0,
      minimum_stock: 0,
    },
    select: sparePartStockSelect,
  });
}

export async function updateSparePartStock(variantId, data) {
  return prisma.sparePartStock.update({
    where: {
      variant_id: variantId,
    },
    data,
    select: sparePartStockSelect,
  });
}

export async function adjustSparePartStock(variantId, quantity) {
  return prisma.$transaction(async (tx) => {
    const stock = await tx.sparePartStock.findUnique({
      where: {
        variant_id: variantId,
      },
    });

    if (!stock) {
      const error = new Error("Spare part stock not found");

      error.statusCode = 404;

      throw error;
    }

    const newStock = stock.stock + quantity;

    if (newStock < 0) {
      const error = new Error("Insufficient stock");

      error.statusCode = 422;

      throw error;
    }

    if (newStock < stock.reserved_stock) {
      const error = new Error("Stock cannot be lower than reserved stock");

      error.statusCode = 422;

      throw error;
    }

    return tx.sparePartStock.update({
      where: {
        variant_id: variantId,
      },

      data: {
        stock: newStock,
      },

      select: sparePartStockSelect,
    });
  });
}
