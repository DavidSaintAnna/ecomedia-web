import { useId, type InputHTMLAttributes } from 'react';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
}

// Campo de formulário acessível: rótulo ligado ao campo e a dica e o erro lidos por leitores de tela.
export function Field({ label, error, hint, ...input }: FieldProps) {
  const id = useId();
  const dicaId = `${id}-dica`;
  const erroId = `${id}-erro`;
  const descricao = [hint ? dicaId : null, error ? erroId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={dicaId} className="campo-dica">
          {hint}
        </p>
      )}
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={descricao} {...input} />
      {error && (
        <p id={erroId} className="campo-erro">
          {error}
        </p>
      )}
    </div>
  );
}
