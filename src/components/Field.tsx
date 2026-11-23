import { useState, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: string;
  error?: string;
};

export function Field({ label, icon, error, type = 'text', id, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="icon pointer-events-none absolute left-3 text-primary">{icon}</span>
        <input
          id={id}
          type={isPw && show ? 'text' : type}
          className={`h-12 w-full rounded-xl bg-surface-container-low pl-10 pr-11 text-sm
            placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none
            focus:ring-2 ${error ? 'ring-2 ring-error' : 'focus:ring-primary'}`}
          {...rest}
        />
        {isPw && (
          <button
            type="button"
            aria-label={show ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 flex h-8 w-8 items-center justify-center text-on-surface-variant"
          >
            <span className="icon">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
