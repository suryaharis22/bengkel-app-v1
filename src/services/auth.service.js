import bcrypt from "bcryptjs";

import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  findUserByUsernameOrEmail,
} from "@/models/user.model";

import { signToken } from "@/lib/jwt";

const SALT_ROUNDS = 12;

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    no_hp: user.no_hp,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function registerUser(data) {
  const existingUsername = await findUserByUsername(data.username);

  if (existingUsername) {
    throw createAuthError("Username already exists", 409);
  }

  const existingEmail = await findUserByEmail(data.email);

  if (existingEmail) {
    throw createAuthError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await createUser({
    username: data.username,
    email: data.email,
    no_hp: data.no_hp || null,
    password: hashedPassword,
    role: "customer",
  });

  return sanitizeUser(user);
}

export async function loginUser(identifier, password) {
  const user = await findUserByUsernameOrEmail(identifier);

  if (!user) {
    throw createAuthError("Invalid username/email or password", 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw createAuthError("Invalid username/email or password", 401);
  }

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw createAuthError("User not found", 404);
  }

  return sanitizeUser(user);
}
