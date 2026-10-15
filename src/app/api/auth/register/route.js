import { registerController } from "@/controllers/auth.controller";

export async function POST(request) {
  return registerController(request);
}
