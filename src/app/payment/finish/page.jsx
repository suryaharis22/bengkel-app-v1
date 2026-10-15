import { Suspense } from "react";
import PaymentFinishContent from "./PaymentFinishContent";

export default function PaymentFinishPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading payment information..
            </p>
          </div>
        </main>
      }
    >
      <PaymentFinishContent />
    </Suspense>
  );
}
