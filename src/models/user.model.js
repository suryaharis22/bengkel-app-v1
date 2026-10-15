import { prisma } from "@/lib/prisma";

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

export async function findUserByUsername(username) {
  return prisma.user.findUnique({
    where: {
      username,
    },
  });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function findUserByUsernameOrEmail(identifier) {
  return prisma.user.findFirst({
    where: {
      OR: [
        {
          username: identifier,
        },
        {
          email: identifier,
        },
      ],
    },
  });
}

export async function findUsers({ skip = 0, take = 10, search = "", role }) {
  const where = {
    ...(search
      ? {
          OR: [
            {
              username: {
                contains: search,
              },
            },
            {
              email: {
                contains: search,
              },
            },
            {
              no_hp: {
                contains: search,
              },
            },
          ],
        }
      : {}),

    ...(role
      ? {
          role,
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        no_hp: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    total,
  };
}

export async function createUser(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: {
      id,
    },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function deleteUser(id) {
  return prisma.user.delete({
    where: {
      id,
    },
  });
}
