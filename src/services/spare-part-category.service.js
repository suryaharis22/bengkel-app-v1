import {
  createSparePartCategory,
  deleteSparePartCategory,
  findChildCategories,
  findSparePartCategories,
  findSparePartCategoryById,
  findSparePartCategoryByName,
  findSparePartCategoryBySlug,
  updateSparePartCategory,
} from "@/models/spare-part-category.model";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    parent_id: category.parent_id,

    parent: category.parent
      ? {
          id: category.parent.id,
          name: category.parent.name,
          slug: category.parent.slug,
        }
      : null,

    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: category.image_url,
    sort_order: category.sort_order,
    status: category.status,

    counts: {
      children: category._count?.children ?? 0,
      products: category._count?.products ?? 0,
    },

    created_at: category.created_at,
    updated_at: category.updated_at,
  };
}

export async function getSparePartCategories({
  page = 1,
  perPage = 10,
  search = "",
  status,
  parentId,
}) {
  const skip = (page - 1) * perPage;

  const result = await findSparePartCategories({
    skip,
    take: perPage,
    search,
    status,
    parentId,
  });

  return {
    categories: result.categories.map(sanitizeCategory),
    total: result.total,
  };
}

export async function getSparePartCategoryById(id) {
  const category = await findSparePartCategoryById(id);

  if (!category) {
    throw createServiceError("Spare part category not found", 404);
  }

  return sanitizeCategory(category);
}

export async function createNewSparePartCategory(data) {
  /**
   * Validate parent category.
   *
   * parent_id = null/undefined
   * → category utama/root category.
   *
   * parent_id = number
   * → category menjadi child dari category tersebut.
   */
  if (data.parent_id !== null && data.parent_id !== undefined) {
    const parentCategory = await findSparePartCategoryById(data.parent_id);

    if (!parentCategory) {
      throw createServiceError("Parent category not found", 404);
    }

    if (!parentCategory.status) {
      throw createServiceError("Parent category is inactive", 422);
    }
  }

  const existingSlug = await findSparePartCategoryBySlug(data.slug);

  if (existingSlug) {
    throw createServiceError("Category slug already exists", 409);
  }

  const existingName = await findSparePartCategoryByName(data.name);

  if (existingName) {
    throw createServiceError("Category name already exists", 409);
  }

  const category = await createSparePartCategory({
    parent_id: data.parent_id ?? null,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image_url: data.image_url || null,
    sort_order: data.sort_order ?? 0,
    status: data.status ?? true,
  });

  return sanitizeCategory(category);
}

export async function updateExistingSparePartCategory(id, data) {
  const existingCategory = await findSparePartCategoryById(id);

  if (!existingCategory) {
    throw createServiceError("Spare part category not found", 404);
  }

  /**
   * Validate parent category when parent_id
   * is included in the update payload.
   */
  if (data.parent_id !== undefined) {
    /**
     * A category cannot be its own parent.
     */
    if (data.parent_id === id) {
      throw createServiceError("Category cannot be its own parent", 422);
    }

    /**
     * parent_id = null means removing
     * the current parent and making this
     * category a root category.
     */
    if (data.parent_id !== null) {
      const parentCategory = await findSparePartCategoryById(data.parent_id);

      if (!parentCategory) {
        throw createServiceError("Parent category not found", 404);
      }

      /**
       * An inactive category cannot be used
       * as a parent.
       */
      if (!parentCategory.status) {
        throw createServiceError("Parent category is inactive", 422);
      }

      /**
       * Prevent circular relationships.
       *
       * Example:
       *
       * A
       * └── B
       *     └── C
       *
       * A cannot use C as its parent.
       */
      let currentParentId = parentCategory.parent_id;

      while (currentParentId) {
        if (currentParentId === id) {
          throw createServiceError(
            "Category cannot use its child as parent",
            422,
          );
        }

        const ancestor = await findSparePartCategoryById(currentParentId);

        if (!ancestor) {
          break;
        }

        currentParentId = ancestor.parent_id;
      }
    }
  }

  /**
   * Validate slug uniqueness.
   */
  if (data.slug !== undefined && data.slug !== existingCategory.slug) {
    const existingSlug = await findSparePartCategoryBySlug(data.slug);

    if (existingSlug) {
      throw createServiceError("Category slug already exists", 409);
    }
  }

  /**
   * Validate name uniqueness.
   */
  if (data.name !== undefined && data.name !== existingCategory.name) {
    const existingName = await findSparePartCategoryByName(data.name);

    if (existingName && existingName.id !== id) {
      throw createServiceError("Category name already exists", 409);
    }
  }

  const updateData = {
    ...(data.parent_id !== undefined && {
      parent_id: data.parent_id,
    }),

    ...(data.name !== undefined && {
      name: data.name,
    }),

    ...(data.slug !== undefined && {
      slug: data.slug,
    }),

    ...(data.description !== undefined && {
      description: data.description || null,
    }),

    ...(data.image_url !== undefined && {
      image_url: data.image_url || null,
    }),

    ...(data.sort_order !== undefined && {
      sort_order: data.sort_order,
    }),

    ...(data.status !== undefined && {
      status: data.status,
    }),
  };

  const category = await updateSparePartCategory(id, updateData);

  return sanitizeCategory(category);
}

export async function deleteExistingSparePartCategory(id) {
  const existingCategory = await findSparePartCategoryById(id);

  if (!existingCategory) {
    throw createServiceError("Spare part category not found", 404);
  }

  /**
   * Category cannot be deleted if it
   * still has child categories.
   */
  const children = await findChildCategories(id);

  if (children.length > 0) {
    throw createServiceError(
      "Cannot delete category because it has child categories",
      409,
    );
  }

  /**
   * Category cannot be deleted if it is
   * already used by spare parts.
   */
  if (existingCategory._count?.products > 0) {
    throw createServiceError(
      "Cannot delete category because it is used by spare parts",
      409,
    );
  }

  await deleteSparePartCategory(id);
}
