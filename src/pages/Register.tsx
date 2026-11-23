import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { parseError } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';
import { Field } from '../components/Field';
import { GoogleButton } from '../components/GoogleButton';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', identifier: '', password: '', password_confirmation: '' });
  const [errs, setErrs] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrs({});
    setMsg('');
    setBusy(true);
    try {
      await register(f);
      nav('/', { replace: true });
    } catch (x) {
      const p = parseError(x);
      setErrs(p.errors ?? {});
      if (!p.errors) setMsg(p.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Buat Akun Baru" subtitle="Daftar sekali, pesan tanpa antre kapan saja.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field id="name" label="Nama" icon="person" autoComplete="name" placeholder="Nama lengkap"
          value={f.name} onChange={set('name')} error={errs.name?.[0]} required />
        <Field id="identifier" label="Nomor HP atau Email" icon="alternate_email" autoComplete="username"
          placeholder="08123456789 atau email@domain.com" value={f.identifier}
          onChange={set('identifier')} error={errs.identifier?.[0]} required />
        <Field id="password" label="Kata Sandi" icon="lock" type="password" autoComplete="new-password"
          placeholder="Minimal 8 karakter" value={f.password} onChange={set('password')}
          error={errs.password?.[0]} required minLength={8} />
        <Field id="password_confirmation" label="Ulangi Kata Sandi" icon="lock" type="password"
          autoComplete="new-password" placeholder="Ketik ulang kata sandi"
          value={f.password_confirmation} onChange={set('password_confirmation')}
          error={errs.password_confirmation?.[0]} required />
        {msg && (
          <p className="rounded-lg bg-error-container p-3 text-xs text-on-error-container">{msg}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 items-center justify-center rounded-xl bg-primary font-headline font-bold
            text-on-primary shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? 'Memproses...' : 'Daftar Sekarang'}
        </button>
        <GoogleButton onError={setMsg} />
      </form>
    </AuthLayout>
  );
}
