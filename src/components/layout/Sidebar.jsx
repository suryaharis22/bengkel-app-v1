"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  Users,
  X,
  UserRound,
  Tags,
  Package,
  ReceiptText,
  CalendarCheck,
  Wrench,
  ClipboardList,
  ChevronDown,
  UserCircle,
  Motorbike,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import LogoutButton from "@/components/auth/LogoutButton";

const ROLE_CONFIG = {
  admin: {
    title: "Admin",
    menus: [
      {
        id: "admin-dashboard",
        label: "Dashboard",
        href: ROUTES.ADMIN.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        id: "admin-management",
        label: "Management",
        icon: Users,
        children: [
          {
            id: "admin-users",
            label: "Users",
            href: ROUTES.ADMIN.MANAGEMENT.USERS,
            icon: Users,
          },
        ],
      },
      {
        id: "admin-workshop",
        label: "Workshop",
        icon: Wrench,
        children: [
          {
            id: "admin-services",
            label: "Jasa Services",
            href: ROUTES.ADMIN.WORKSHOP.SERVICES,
            icon: Wrench,
          },
          {
            id: "admin-spare-parts",
            label: "Spare Parts",
            href: ROUTES.ADMIN.WORKSHOP.SPARE_PARTS,
            icon: Package,
          },
          {
            id: "admin-spare-part-categories",
            label: "Categories",
            href: ROUTES.ADMIN.WORKSHOP.SPARE_PART_CATEGORIES,
            icon: Tags,
          },
          {
            id: "admin-brands",
            label: "Brands",
            href: ROUTES.ADMIN.WORKSHOP.BRANDS,
            icon: Tags,
          },
          {
            id: "admin-vehicles",
            label: "Vehicles",
            href: ROUTES.ADMIN.WORKSHOP.VEHICLES,
            icon: Motorbike,
          },
        ],
      },
      {
        id: "admin-transactions",
        label: "Transactions",
        icon: ReceiptText,
        children: [
          {
            id: "admin-bookings",
            label: "Bookings",
            href: ROUTES.ADMIN.TRANSACTIONS.BOOKINGS,
            icon: CalendarCheck,
          },
          {
            id: "admin-service-orders",
            label: "Service Orders",
            href: ROUTES.ADMIN.TRANSACTIONS.SERVICE_ORDERS,
            icon: ClipboardList,
          },
          {
            id: "admin-cashier",
            label: "Cashier",
            href: ROUTES.ADMIN.TRANSACTIONS.CASHIER,
            icon: ReceiptText,
          },
        ],
      },
    ],
  },

  teknisi: {
    title: "Teknisi",
    menus: [
      {
        id: "teknisi-dashboard",
        label: "Dashboard",
        href: ROUTES.TEKNISI.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        id: "teknisi-workshop",
        label: "Workshop",
        icon: Wrench,
        children: [
          {
            id: "teknisi-service-orders",
            label: "Service Orders",
            href: ROUTES.TEKNISI.WORKSHOP.SERVICE_ORDERS,
            icon: ClipboardList,
          },
          {
            id: "teknisi-bookings",
            label: "Bookings",
            href: ROUTES.TEKNISI.WORKSHOP.BOOKINGS,
            icon: CalendarCheck,
          },
        ],
      },
    ],
  },

  customer: {
    title: "Customer",
    menus: [
      {
        id: "customer-dashboard",
        label: "Dashboard",
        href: ROUTES.CUSTOMER.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        id: "customer-workshop",
        label: "My Workshop",
        icon: Wrench,
        children: [
          {
            id: "customer-bookings",
            label: "Bookings",
            href: ROUTES.CUSTOMER.WORKSHOP.BOOKINGS,
            icon: CalendarCheck,
          },
          {
            id: "customer-service-orders",
            label: "Service Orders",
            href: ROUTES.CUSTOMER.WORKSHOP.SERVICE_ORDERS,
            icon: ClipboardList,
          },
        ],
      },
      {
        id: "customer-account",
        label: "Account",
        icon: UserCircle,
        children: [
          {
            id: "customer-profile",
            label: "Profile",
            href: ROUTES.CUSTOMER.ACCOUNT.PROFILE,
            icon: UserRound,
          },
          {
            id: "customer-vehicles",
            label: "Vehicles",
            href: ROUTES.CUSTOMER.ACCOUNT.VEHICLES,
            icon: Motorbike,
          },
        ],
      },
    ],
  },
};

const BASE_LINK_CLASS =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200";

const ACTIVE_LINK_CLASS = "bg-red-50 text-red-600 shadow-sm shadow-red-100";

const INACTIVE_LINK_CLASS =
  "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

function isActivePath(pathname, href) {
  if (!pathname || !href) return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuItem({ menu, pathname, openGroups, toggleGroup, closeSidebar }) {
  const Icon = menu.icon;
  const hasChildren = Boolean(menu.children?.length);
  const isOpen = openGroups.includes(menu.id);

  const isActive = hasChildren
    ? menu.children.some((child) => isActivePath(pathname, child.href))
    : isActivePath(pathname, menu.href);

  if (!hasChildren) {
    return (
      <Link
        href={menu.href}
        onClick={closeSidebar}
        aria-current={isActive ? "page" : undefined}
        className={`${BASE_LINK_CLASS} ${
          isActive ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS
        }`}
      >
        <Icon
          size={19}
          strokeWidth={isActive ? 2.2 : 1.8}
          className="shrink-0"
        />

        <span className="min-w-0 flex-1 truncate">{menu.label}</span>

        {isActive && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleGroup(menu.id)}
        aria-expanded={isOpen}
        className={`${BASE_LINK_CLASS} justify-between ${
          isActive ? "text-slate-900" : INACTIVE_LINK_CLASS
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Icon
            size={19}
            strokeWidth={isActive ? 2.2 : 1.8}
            className={`shrink-0 ${
              isActive ? "text-red-600" : "text-slate-500"
            }`}
          />

          <span className="truncate">{menu.label}</span>
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 py-1 pl-3">
          {menu.children.map((child) => {
            const ChildIcon = child.icon;
            const childIsActive = isActivePath(pathname, child.href);

            return (
              <Link
                key={child.id}
                href={child.href}
                onClick={closeSidebar}
                aria-current={childIsActive ? "page" : undefined}
                className={`${BASE_LINK_CLASS} gap-2.5 px-3 py-2 text-[13px] ${
                  childIsActive
                    ? ACTIVE_LINK_CLASS
                    : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <ChildIcon
                  size={17}
                  strokeWidth={childIsActive ? 2.2 : 1.8}
                  className="shrink-0"
                />

                <span className="min-w-0 flex-1 truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ role, user }) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);

  const config = ROLE_CONFIG[role];

  const activeGroups =
    config?.menus
      .filter((menu) =>
        menu.children?.some((child) => isActivePath(pathname, child.href)),
      )
      .map((menu) => menu.id) || [];

  const visibleOpenGroups = [...new Set([...openGroups, ...activeGroups])];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!config) return null;

  function toggleGroup(id) {
    setOpenGroups((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function closeSidebar() {
    setOpen(false);
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka sidebar"
          aria-expanded={open}
          aria-controls="app-sidebar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Menu size={22} />
        </button>

        <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-200">
          <Wrench size={20} />
        </div>

        <div className="ml-3 min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-slate-900">
            Bengkel App
          </p>
          <p className="truncate text-xs text-slate-500">{config.title}</p>
        </div>
      </header>

      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-200">
              <Wrench size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900">
                Bengkel App
              </h1>
              <p className="truncate text-xs text-slate-500">
                Workshop Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Tutup sidebar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Role */}
        <div className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm ring-1 ring-slate-200/70">
            {role === "admin" ? (
              <Users size={20} />
            ) : role === "teknisi" ? (
              <Wrench size={20} />
            ) : (
              <UserCircle size={20} />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {config.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Panel operasional</p>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="flex-1 overflow-y-auto px-4 py-5"
        >
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Menu Utama
          </p>

          <div className="space-y-1.5">
            {config.menus.map((menu) => (
              <MenuItem
                key={menu.id}
                menu={menu}
                pathname={pathname}
                openGroups={visibleOpenGroups}
                toggleGroup={toggleGroup}
                closeSidebar={closeSidebar}
              />
            ))}
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="shrink-0 border-t border-slate-200 p-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <UserRound size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.username || config.title}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || "Akun pengguna"}
              </p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
