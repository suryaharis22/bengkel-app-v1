"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const INITIAL_FORM = {
  username: "",
  email: "",
  no_hp: "",
  password: "",
  role: "customer",
};

export default function UserForm({ user, onClose, onSuccess }) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState(INITIAL_FORM);

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        no_hp: user.no_hp || "",
        password: "",
        role: user.role || "customer",
      });

      return;
    }

    setForm(INITIAL_FORM);
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!isEdit && !form.password) {
      toast.error("Password is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        no_hp: form.no_hp.trim(),
        role: form.role,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await api.put(`/admin/users/${user.id}`, payload);

        toast.success("User updated successfully");
      } else {
        await api.post("/admin/users", {
          ...payload,
          password: form.password,
        });

        toast.success("User created successfully");
      }

      onSuccess();
    } catch (error) {
      const apiError = getAxiosError(error);

      if (apiError.code === 422 && apiError.errors) {
        const firstError = Object.values(apiError.errors)[0];

        toast.error(firstError || apiError.message);

        return;
      }

      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="user-form-title"
              className="text-lg font-semibold text-gray-900"
            >
              {isEdit ? "Edit User" : "Add User"}
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {isEdit
                ? "Update user information."
                : "Create a new user account."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {/* Username */}
          <div>
            <label
              htmlFor="user-form-username"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="user-form-username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
                disabled={loading}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="user-form-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="user-form-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                disabled={loading}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="user-form-no_hp"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone Number
              <span className="ml-1 text-gray-400">(Optional)</span>
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="user-form-no_hp"
                name="no_hp"
                type="tel"
                value={form.no_hp}
                onChange={handleChange}
                placeholder="Enter phone number"
                disabled={loading}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="user-form-role"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Role
            </label>

            <select
              id="user-form-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="admin">Admin</option>

              <option value="teknisi">Teknisi</option>

              <option value="customer">Customer</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="user-form-password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
              {isEdit && <span className="ml-1 text-gray-400">(Optional)</span>}
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="user-form-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                autoComplete="new-password"
                disabled={loading}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              Password must be at least 6 characters.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}

              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
