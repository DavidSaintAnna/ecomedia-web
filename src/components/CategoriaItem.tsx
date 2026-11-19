import { useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useDeleteCategory, useUpdateCategory } from '../api/hooks';
import type { Category } from '../api/types';
import { useFocusOnError } from '../lib/useFocusOnError';
import { CATEGORIA_DESCRICAO_MAXIMA, errosDaApi, validarCategoria, type Erros } from '../lib/validation';
import { Field } from './Field';
import { TextArea } from './TextArea';

interface Props {
  categoria: Category;
  modo: 'ver' | 'editar' | 'excluir';
  /** Pede à lista para abrir só um campo de cada vez (editar ou confirmar exclusão). */
  onModo: (modo: 'ver' | 'editar' | 'excluir') => void;
}

/** Uma categoria na lista do administrador: ver, editar no lugar e excluir com confirmação (sem janela do navegador). */
export function CategoriaItem({ categoria, modo, onModo }: Props) {
  const atualizar = useUpdateCategory();
  const excluir = useDeleteCategory();
  const [valores, setValores] = useState({ name: categoria.name, description: categoria.description ?? '' });
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erros, mensagem);

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (atualizar.isPending) return;
    setMensagem(null);
    const locais = validarCategoria(valores);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    atualizar.mutate(
      { id: categoria.id, name: valores.name.trim(), description: valores.description.trim() || null },
      {
        onSuccess: () => onModo('ver'),
        onError: (erro) => {
          if (erro instanceof ApiError && erro.status === 409) {
            setErros({ name: 'Já existe uma categoria com esse nome.' });
            setMensagem(null);
          } else if (erro instanceof ApiError) {
            const porCampo = errosDaApi(erro, ['name', 'description']);
            setErros(porCampo);
            setMensagem(Object.keys(porCampo).length > 0 ? null : erro.message);
          } else {
            setMensagem('Não foi possível salvar.');
          }
        },
      },
    );
  }

  if (modo === 'editar') {
    return (
      <li className="categoria-item categoria-editando">
        <form ref={formRef} onSubmit={salvar} noValidate aria-label={`Editar a categoria ${categoria.name}`}>
          {mensagem && (
            <div role="alert" tabIndex={-1} className="aviso-erro aviso-compacto">
              {mensagem}
            </div>
          )}
          <Field label="Nome" name="name" value={valores.name} onChange={(e) => setValores((v) => ({ ...v, name: e.target.value }))} error={erros.name} />
          <TextArea
            label="Descrição (opcional)"
            name="description"
            rows={3}
            value={valores.description}
            onChange={(e) => setValores((v) => ({ ...v, description: e.target.value }))}
            error={erros.description}
            contador={{ atual: valores.description.length, maximo: CATEGORIA_DESCRICAO_MAXIMA }}
          />
          <div className="acoes-form">
            <button type="submit" className="btn btn-pequeno" disabled={atualizar.isPending}>
              {atualizar.isPending ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="btn btn-claro btn-pequeno" disabled={atualizar.isPending} onClick={() => onModo('ver')}>
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="categoria-item">
      <div className="categoria-texto">
        <p className="categoria-nome">{categoria.name}</p>
        <p className="categoria-descricao">{categoria.description ?? 'Sem descrição.'}</p>
      </div>

      {modo === 'ver' && (
        <div className="acoes-post">
          <button type="button" className="btn btn-claro btn-pequeno" aria-label={`Editar a categoria ${categoria.name}`} onClick={() => onModo('editar')}>
            Editar
          </button>
          <button
            type="button"
            className="btn btn-claro btn-pequeno btn-perigo"
            aria-label={`Excluir a categoria ${categoria.name}`}
            onClick={() => {
              excluir.reset();
              onModo('excluir');
            }}
          >
            Excluir
          </button>
        </div>
      )}

      {modo === 'excluir' && (
        <div className="acoes-post">
          <div role="group" aria-label={`Confirmar exclusão da categoria ${categoria.name}`} className="confirmar">
            <p>Excluir a categoria “{categoria.name}”? Isso não pode ser desfeito.</p>
            <button
              type="button"
              className="btn btn-pequeno btn-perigo-cheio"
              disabled={excluir.isPending}
              onClick={() => excluir.mutate(categoria.id)}
            >
              {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
            </button>{' '}
            <button type="button" className="btn btn-claro btn-pequeno" disabled={excluir.isPending} onClick={() => onModo('ver')}>
              Cancelar
            </button>
          </div>
          {excluir.isError && (
            <p role="alert" className="campo-erro">
              {excluir.error instanceof ApiError && excluir.error.status === 409
                ? 'Essa categoria já tem publicações, então não pode ser excluída. Você pode renomeá-la ou, antes, excluir as publicações dela.'
                : excluir.error.message}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
