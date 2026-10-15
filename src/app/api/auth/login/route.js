import { loginController } from "@/controllers/auth.controller";

export async function POST(request) {
  return loginController(request);
}
