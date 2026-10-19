import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, TrendingUp, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/FormField';

// Same copy as the Sarvadesk sign-in screen.
const HIGHLIGHTS = [
  { icon: TrendingUp, text: 'Track leads, proposals & margins per KL' },
  { icon: Truck, text: 'Schedule tanker dispatch end-to-end' },
  { icon: ShieldCheck, text: 'GST-compliant invoicing built in' },
];

/** Same sign-in as v1 — POST /api/login with your user ID or email. */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/leads';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Enter your user ID or email and your password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Login failed');
      return;
    }
    toast.success('Signed in');
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-base">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-brand-primary lg:flex lg:flex-col">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-secondary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-accent/15 blur-3xl" />

        <div className="relative flex flex-1 flex-col p-12 text-white">
          <Logo inverted />
          <div className="my-auto max-w-md">
            <h1 className="font-display text-4xl font-bold leading-tight">
              The CRM built for petroleum &amp; petrochemical trading.
            </h1>
            <p className="mt-3 text-white/70">
              From refinery sourcing to last-mile tanker delivery — manage your entire sales pipeline in one place.
            </p>
            <div className="mt-8 space-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="size-[18px] text-brand-secondary" />
                  </div>
                  <span className="text-sm text-white/85">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/40">© {new Date().getFullYear()} Peliswan</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-2xl font-bold text-content">Welcome back</h2>
          <p className="mt-1 text-sm text-content-muted">Sign in with your Peliswan CRM account</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <FormField label="User ID or email" htmlFor="identifier">
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. PS001 or you@company.com"
                  className="pl-8"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </FormField>

            <FormField label="Password" htmlFor="password">
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-8"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Sign in {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
