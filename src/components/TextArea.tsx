import { useId, type TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  /** Mostra "12/500" embaixo do campo. */
  contador?: { atual: number; maximo: number; minimo?: number };
}

export function TextArea({ label, error, contador, ...campo }: TextAreaProps) {
  const id = useId();
  const erroId = `${id}-erro`;
  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={3} aria-invalid={error ? true : undefined} aria-describedby={error ? erroId : undefined} {...campo} />
      <div className="campo-rodape">
        {error ? (
          <p id={erroId} className="campo-erro">
            {error}
          </p>
        ) : (
          <span />
        )}
        {contador && (
          <span className="campo-contador">
            {contador.atual}/{contador.maximo}
            {contador.minimo ? ` · mínimo ${contador.minimo}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
