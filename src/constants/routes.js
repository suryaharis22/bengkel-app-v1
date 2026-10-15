export const ROUTES = {
  LOGIN: "/login",

  ADMIN: {
    DASHBOARD: "/admin/dashboard",

    MANAGEMENT: {
      USERS: "/admin/users",
    },

    WORKSHOP: {
      SERVICES: "/admin/services",
      SPARE_PARTS: "/admin/spare-parts",
      SPARE_PART_CATEGORIES: "/admin/spare-part-categories",
      BRANDS: "/admin/brands",
      VEHICLES: "/admin/vehicles",
    },

    TRANSACTIONS: {
      BOOKINGS: "/admin/bookings",
      SERVICE_ORDERS: "/admin/service-orders",
      CASHIER: "/admin/cashier",
    },
  },

  TEKNISI: {
    DASHBOARD: "/teknisi/dashboard",

    WORKSHOP: {
      BOOKINGS: "/teknisi/bookings",
      SERVICE_ORDERS: "/teknisi/service-orders",
    },
  },

  CUSTOMER: {
    DASHBOARD: "/customer/dashboard",

    WORKSHOP: {
      BOOKINGS: "/customer/bookings",
      SERVICE_ORDERS: "/customer/service-orders",
    },

    ACCOUNT: {
      PROFILE: "/customer/profile",
      VEHICLES: "/customer/vehicles",
    },
  },
};
