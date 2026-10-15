import { prisma } from "@/lib/prisma";

export async function findSaleItemById(id) {
  return prisma.saleItem.findUnique({
    where: { id },
  });
}

export async function findSaleItemsBySaleId(saleId) {
  return prisma.saleItem.findMany({
    where: {
      sale_id: saleId,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function createSaleItem(data, tx = prisma) {
  return tx.saleItem.create({
    data,
  });
}

export async function updateSaleItem(id, data, tx = prisma) {
  return tx.saleItem.update({
    where: { id },
    data,
  });
}

export async function deleteSaleItem(id, tx = prisma) {
  return tx.saleItem.delete({
    where: { id },
  });
}

export async function deleteSaleItemsBySaleId(saleId, tx = prisma) {
  return tx.saleItem.deleteMany({
    where: {
      sale_id: saleId,
    },
  });
}
