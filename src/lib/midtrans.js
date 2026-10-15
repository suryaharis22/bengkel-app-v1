import midtransClient from "midtrans-client";
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
if (!process.env.MIDTRANS_SERVER_KEY) {
  throw new Error("MIDTRANS_SERVER_KEY is not configured.");
}
if (!process.env.MIDTRANS_CLIENT_KEY) {
  throw new Error("MIDTRANS_CLIENT_KEY is not configured.");
}
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
export const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY;
