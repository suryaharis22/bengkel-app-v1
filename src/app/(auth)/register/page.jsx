import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bengkel App</h1>

          <p className="mt-2 text-sm text-gray-600">
            Create your customer account
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
