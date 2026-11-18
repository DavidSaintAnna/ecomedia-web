import { useId, useRef, useState, type ChangeEvent } from 'react';
import { useEnviarFoto } from '../api/hooks';
import { API_URL } from '../config';
import { ehFotoEnviada, type OpcoesDeReducao } from '../lib/imagem';
import { Field } from './Field';

interface Props {
  /** Nome do campo do link (imageUrl, avatarUrl): também é o nome usado nos erros da API. */
  name: string;
  /** Texto do campo do link (opcional) */
  rotuloLink: string;
  dicaLink: string;
  rotuloBotao: string;
  /** Como reduzir a foto antes de enviar (tamanho e recorte). */
  reducao: OpcoesDeReducao;
  /** true = a prévia é redonda (foto de perfil) */
  redonda?: boolean;
  valor: string;
  erro?: string;
  onChange: (link: string) => void;
  /** Avisa quando uma foto está sendo enviada, para o formulário não ser enviado antes de terminar. */
  onOcupado?: (ocupado: boolean) => void;
}

// Foto do computador (reduzida e enviada para a API) ou, se preferir, o link de uma foto da internet.
export function EscolherFoto({ name, rotuloLink, dicaLink, rotuloBotao, reducao, redonda = false, valor, erro, onChange, onOcupado }: Props) {
  const enviar = useEnviarFoto();
  const entrada = useRef<HTMLInputElement>(null);
  const id = useId();
  const [problema, setProblema] = useState<string | null>(null);
  const [quebrada, setQuebrada] = useState(false);
  const enviada = ehFotoEnviada(valor.trim(), API_URL);

  function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo depois de remover
    if (!arquivo) return;
    setProblema(null);
    setQuebrada(false);
    onOcupado?.(true);
    enviar.mutate(
      { arquivo, opcoes: reducao },
      {
        onSuccess: (imagem) => onChange(imagem.url),
        onError: (e) => setProblema(e.message),
        onSettled: () => onOcupado?.(false),
      },
    );
  }

  function remover() {
    setProblema(null);
    onChange('');
    entrada.current?.focus();
  }

  return (
    <div className="foto-campo">
      {enviada && !quebrada && (
        <img className={redonda ? 'foto-previa foto-previa-redonda' : 'foto-previa'} src={valor} alt="Prévia da foto escolhida" onError={() => setQuebrada(true)} />
      )}
      {enviada && quebrada && <p className="campo-dica">Foto enviada, mas não consegui mostrar a prévia agora.</p>}

      <div className="foto-botoes">
        <input
          ref={entrada}
          id={id}
          className="foto-entrada"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          onChange={escolher}
          disabled={enviar.isPending}
        />
        <label htmlFor={id} className={enviar.isPending ? 'btn btn-claro btn-pequeno desativado' : 'btn btn-claro btn-pequeno'}>
          {enviar.isPending ? 'Enviando foto…' : enviada ? 'Trocar foto' : rotuloBotao}
        </label>
        {valor.trim() !== '' && (
          <button type="button" className="btn btn-claro btn-pequeno" onClick={remover} disabled={enviar.isPending}>
            Remover foto
          </button>
        )}
      </div>

      <div role="status" className="foto-estado">
        {enviar.isPending ? 'Enviando a foto, um instante…' : ''}
      </div>
      {problema && (
        <p role="alert" className="campo-erro">
          {problema}
        </p>
      )}

      {enviada ? (
        // o link da foto enviada é só um número interno: não precisa aparecer num campo de texto
        erro && (
          <p role="alert" className="campo-erro">
            {erro}
          </p>
        )
      ) : (
        <Field
          label={rotuloLink}
          hint={dicaLink}
          type="url"
          name={name}
          inputMode="url"
          autoComplete="off"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          error={erro}
        />
      )}
    </div>
  );
}
