import { useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { useCategories } from '../api/hooks';
import type { ValoresPost } from '../lib/postBody';
import { useFocusOnError } from '../lib/useFocusOnError';
import { POST_MAXIMO, POST_MINIMO, errosDaApi, validarPost, type Erros } from '../lib/validation';
import { Field } from './Field';
import { TextArea } from './TextArea';

const CAMPOS = ['categoryId', 'content', 'imageUrl', 'city'];

interface Props {
  titulo: string;
  inicial: ValoresPost;
  rotuloEnviar: string;
  rotuloEnviando: string;
  dicaCidade?: string;
  voltarPara: string;
  /** Faz a chamada à API. Se falhar, a mensagem (ou os erros por campo) aparece no formulário. */
  onEnviar: (valores: ValoresPost) => Promise<void>;
}

export function PostForm({ titulo, inicial, rotuloEnviar, rotuloEnviando, dicaCidade, voltarPara, onEnviar }: Props) {
  const categorias = useCategories();
  const categoriaId = useId();
  const [valores, setValores] = useState<ValoresPost>(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erros, mensagem);

  function mudar(campo: keyof ValoresPost, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const locais = validarPost(valores);
    setMensagem(null);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    setEnviando(true);
    try {
      await onEnviar(valores);
    } catch (erro) {
      if (erro instanceof ApiError) {
        const porCampo = errosDaApi(erro, CAMPOS);
        setErros(porCampo);
        setMensagem(Object.keys(porCampo).length > 0 ? null : erro.message);
      } else {
        setMensagem(erro instanceof Error ? erro.message : 'Não foi possível salvar.');
      }
      setEnviando(false);
    }
    // com sucesso a tela troca de página; o botão fica desativado até lá, para não enviar duas vezes
  }

  return (
    <section className="cartao-form cartao-form-largo">
      <h1>{titulo}</h1>

      <form ref={formRef} onSubmit={enviar} noValidate>
        {mensagem && (
          <div role="alert" tabIndex={-1} className="aviso-erro">
            {mensagem}
          </div>
        )}

        <div className="campo">
          <label htmlFor={categoriaId}>Categoria</label>
          <select
            id={categoriaId}
            name="categoryId"
            value={valores.categoryId}
            disabled={categorias.isPending}
            aria-invalid={erros.categoryId ? true : undefined}
            aria-describedby={erros.categoryId ? `${categoriaId}-erro` : undefined}
            onChange={(e) => mudar('categoryId', e.target.value)}
          >
            <option value="">{categorias.isPending ? 'Carregando categorias…' : 'Escolha uma categoria'}</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {erros.categoryId && (
            <p id={`${categoriaId}-erro`} className="campo-erro">
              {erros.categoryId}
            </p>
          )}
          {categorias.isError && (
            <div role="alert" className="aviso-erro aviso-compacto">
              <p>Não consegui carregar as categorias. {categorias.error.message}</p>
              <button type="button" className="btn btn-pequeno" onClick={() => void categorias.refetch()}>
                Tentar de novo
              </button>
            </div>
          )}
        </div>

        <TextArea
          label="O que você quer compartilhar?"
          name="content"
          rows={5}
          value={valores.content}
          onChange={(e) => mudar('content', e.target.value)}
          error={erros.content}
          contador={{ atual: valores.content.length, maximo: POST_MAXIMO, minimo: POST_MINIMO }}
        />

        <Field
          label="Link de uma imagem (opcional)"
          hint="Cole o endereço de uma foto que já está na internet, começando com https://"
          type="url"
          name="imageUrl"
          inputMode="url"
          autoComplete="off"
          value={valores.imageUrl}
          onChange={(e) => mudar('imageUrl', e.target.value)}
          error={erros.imageUrl}
        />

        <Field
          label="Cidade (opcional)"
          hint={dicaCidade}
          name="city"
          autoComplete="address-level2"
          value={valores.city}
          onChange={(e) => mudar('city', e.target.value)}
          error={erros.city}
        />

        <div className="acoes-form">
          <button type="submit" className="btn" disabled={enviando}>
            {enviando ? rotuloEnviando : rotuloEnviar}
          </button>
          <Link to={voltarPara} className="btn btn-claro">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
