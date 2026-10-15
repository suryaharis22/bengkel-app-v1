import { prisma } from "@/lib/prisma";

export async function findSalePaymentById(id) {
  return prisma.salePayment.findUnique({
    where: {
      id,
    },
  });
}

export async function findSalePaymentsBySaleId(saleId) {
  return prisma.salePayment.findMany({
    where: {
      sale_id: saleId,
    },
    orderBy: {
      paid_at: "desc",
    },
  });
}

export async function createManySalePayments(tx, data) {
  return tx.salePayment.createMany({
    data,
  });
}

export async function updateSalePayment(tx, id, data) {
  return tx.salePayment.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteSalePayment(tx, id) {
  return tx.salePayment.delete({
    where: {
      id,
    },
  });
}

export async function deleteSalePaymentsBySaleId(tx, saleId) {
  return tx.salePayment.deleteMany({
    where: {
      sale_id: saleId,
    },
  });
}
