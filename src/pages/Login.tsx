import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { parseError } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';
import { Field } from '../components/Field';
import { GoogleButton } from '../components/GoogleButton';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(identifier, password);
      nav('/', { replace: true });
    } catch (x) {
      const p = parseError(x);
      setErr(p.code === 'UNAUTHENTICATED' ? 'Email/nomor HP atau kata sandi salah.' : p.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Selamat Datang Kembali!"
      subtitle="Masuk untuk melanjutkan pesanan atau melihat riwayat tiket QR Anda."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          id="identifier"
          label="Nomor HP atau Email"
          icon="alternate_email"
          autoComplete="username"
          placeholder="08123456789 atau email@domain.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <Field
          id="password"
          label="Kata Sandi"
          icon="lock"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && (
          <p className="rounded-lg bg-error-container p-3 text-xs text-on-error-container">{err}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-headline font-bold
            text-on-primary shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? 'Memproses...' : 'Masuk Sekarang'}
        </button>
        <GoogleButton onError={setErr} />
      </form>
    </AuthLayout>
  );
}
