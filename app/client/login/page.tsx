import { ClientLoginForm } from '@/components/client-login-form';

export default function ClientLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-white/60">Sign in to access your organization dashboard</p>
        </div>
        <ClientLoginForm />
      </div>
    </div>
  );
}

