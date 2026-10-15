import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  findUsers,
  updateUser,
} from "@/models/user.model";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function getUsers({ page = 1, perPage = 10, search = "", role }) {
  const skip = (page - 1) * perPage;

  const result = await findUsers({
    skip,
    take: perPage,
    search,
    role,
  });

  return result;
}

export async function getUserById(id) {
  const user = await findUserById(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

export async function createNewUser(data) {
  const existingUsername = await findUserByUsername(data.username);

  if (existingUsername) {
    const error = new Error("Username already exists");
    error.statusCode = 409;
    throw error;
  }

  const existingEmail = await findUserByEmail(data.email);

  if (existingEmail) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await createUser({
    username: data.username,
    email: data.email,
    no_hp: data.no_hp || null,
    password: hashedPassword,
    role: data.role || "customer",
  });

  return sanitizeUser(user);
}

export async function updateExistingUser(id, data) {
  const existingUser = await findUserById(id);

  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.username && data.username !== existingUser.username) {
    const usernameExists = await findUserByUsername(data.username);

    if (usernameExists) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  if (data.email && data.email !== existingUser.email) {
    const emailExists = await findUserByEmail(data.email);

    if (emailExists) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  const updateData = {
    ...(data.username !== undefined && {
      username: data.username,
    }),

    ...(data.email !== undefined && {
      email: data.email,
    }),

    ...(data.no_hp !== undefined && {
      no_hp: data.no_hp || null,
    }),

    ...(data.role !== undefined && {
      role: data.role,
    }),
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const user = await updateUser(id, updateData);

  return sanitizeUser(user);
}

export async function deleteExistingUser(id) {
  const existingUser = await findUserById(id);

  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await deleteUser(id);
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
