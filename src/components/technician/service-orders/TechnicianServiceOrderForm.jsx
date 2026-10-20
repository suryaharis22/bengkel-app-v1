"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  LoaderCircle,
  Save,
  Stethoscope,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  let validationMessage = "";

  if (Array.isArray(validationErrors)) {
    validationMessage = validationErrors
      .map((item) =>
        typeof item === "string" ? item : item?.message || item?.msg,
      )
      .filter(Boolean)
      .join(", ");
  } else if (validationErrors && typeof validationErrors === "object") {
    validationMessage = Object.values(validationErrors)
      .flat()
      .map((item) =>
        typeof item === "string" ? item : item?.message || item?.msg,
      )
      .filter(Boolean)
      .join(", ");
  }

  return (
    responseData?.message || validationMessage || error?.message || fallback
  );
}

export default function TechnicianServiceOrderForm({
  serviceOrderId,
  diagnosis: initialDiagnosis = "",
  notes: initialNotes = "",
  status = "pending",
  onSuccess,
}) {
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [notes, setNotes] = useState(initialNotes);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase();

  const canEdit = ["confirmed", "in_progress"].includes(normalizedStatus);

  useEffect(() => {
    setDiagnosis(initialDiagnosis || "");
  }, [initialDiagnosis]);

  useEffect(() => {
    setNotes(initialNotes || "");
  }, [initialNotes]);

  const handleSaveDiagnosis = async (event) => {
    event.preventDefault();

    if (!serviceOrderId) {
      toast.error("ID Service Order tidak ditemukan.");
      return;
    }

    if (!canEdit) {
      toast.error(
        "Diagnosis hanya dapat diubah saat pekerjaan dikonfirmasi atau sedang dikerjakan.",
      );
      return;
    }

    const trimmedDiagnosis = diagnosis.trim();

    if (!trimmedDiagnosis) {
      toast.error("Diagnosis tidak boleh kosong.");
      return;
    }

    if (savingDiagnosis || savingNotes) return;

    setSavingDiagnosis(true);

    try {
      const response = await api.put(
        `/technician/service-orders/${serviceOrderId}/diagnosis`,
        {
          diagnosis: trimmedDiagnosis,
        },
      );

      const payload = response?.data;

      if (payload?.success === false) {
        throw new Error(payload?.message || "Gagal menyimpan diagnosis.");
      }

      toast.success(payload?.message || "Diagnosis berhasil disimpan.");

      onSuccess?.(payload?.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyimpan diagnosis."));
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const handleSaveNotes = async (event) => {
    event.preventDefault();

    if (!serviceOrderId) {
      toast.error("ID Service Order tidak ditemukan.");
      return;
    }

    if (!canEdit) {
      toast.error(
        "Catatan hanya dapat diubah saat pekerjaan dikonfirmasi atau sedang dikerjakan.",
      );
      return;
    }

    if (savingDiagnosis || savingNotes) return;

    setSavingNotes(true);

    try {
      const response = await api.put(
        `/technician/service-orders/${serviceOrderId}/notes`,
        {
          notes: notes.trim(),
        },
      );

      const payload = response?.data;

      if (payload?.success === false) {
        throw new Error(payload?.message || "Gagal menyimpan catatan.");
      }

      toast.success(payload?.message || "Catatan teknisi berhasil disimpan.");

      onSuccess?.(payload?.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyimpan catatan teknisi."));
    } finally {
      setSavingNotes(false);
    }
  };

  const isSaving = savingDiagnosis || savingNotes;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Form belum dapat diedit.
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-700">
            Diagnosis dan catatan dapat diubah ketika status pekerjaan
            Dikonfirmasi atau Sedang Dikerjakan.
          </p>
        </div>
      )}

      {/* Diagnosis */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Stethoscope size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Diagnosis Kerusakan</h2>
            <p className="mt-1 text-sm text-gray-500">
              Catat hasil pemeriksaan kendaraan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveDiagnosis} className="space-y-4">
          <div>
            <label
              htmlFor="technician-diagnosis"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Diagnosis
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              id="technician-diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Contoh: Kampas rem aus dan perlu diganti."
              rows={5}
              maxLength={5000}
              disabled={!canEdit || isSaving}
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            />

            <div className="mt-1.5 flex justify-between gap-3">
              <p className="text-xs text-gray-500">
                Jelaskan kerusakan dan tindakan perbaikan yang diperlukan.
              </p>
              <span className="shrink-0 text-xs text-gray-400">
                {diagnosis.length}/5000
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canEdit || isSaving || !diagnosis.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingDiagnosis ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {savingDiagnosis ? "Menyimpan..." : "Simpan Diagnosis"}
            </button>
          </div>
        </form>
      </section>

      {/* Catatan Teknisi */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <StickyNote size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Catatan Teknisi</h2>
            <p className="mt-1 text-sm text-gray-500">
              Catat progres dan informasi pengerjaan servis.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveNotes} className="space-y-4">
          <div>
            <label
              htmlFor="technician-notes"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Catatan
            </label>

            <textarea
              id="technician-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Tuliskan catatan pengerjaan servis..."
              rows={5}
              maxLength={5000}
              disabled={!canEdit || isSaving}
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            />

            <div className="mt-1.5 flex justify-end">
              <span className="text-xs text-gray-400">{notes.length}/5000</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canEdit || isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingNotes ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <FileText size={17} />
              )}
              {savingNotes ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
