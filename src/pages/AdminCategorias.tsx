import { useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useCategories, useCreateCategory } from '../api/hooks';
import { CategoriaItem } from '../components/CategoriaItem';
import { Field } from '../components/Field';
import { TextArea } from '../components/TextArea';
import { useFocusOnError } from '../lib/useFocusOnError';
import { CATEGORIA_DESCRICAO_MAXIMA, errosDaApi, validarCategoria, type Erros } from '../lib/validation';

const VAZIO = { name: '', description: '' };

export function AdminCategorias() {
  const categorias = useCategories();
  const criar = useCreateCategory();
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [criada, setCriada] = useState<string | null>(null);
  // só uma categoria aberta (para editar ou confirmar exclusão) de cada vez
  const [aberta, setAberta] = useState<{ id: number; modo: 'editar' | 'excluir' } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erros, mensagem);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (criar.isPending) return;
    setCriada(null);
    setMensagem(null);
    const locais = validarCategoria(valores);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    const nome = valores.name.trim();
    criar.mutate(
      { name: nome, ...(valores.description.trim() ? { description: valores.description.trim() } : {}) },
      {
        onSuccess: () => {
          setValores(VAZIO);
          setCriada(`Categoria “${nome}” criada.`);
        },
        onError: (erro) => {
          if (erro instanceof ApiError && erro.status === 409) {
            setErros({ name: 'Já existe uma categoria com esse nome.' });
          } else if (erro instanceof ApiError) {
            const porCampo = errosDaApi(erro, ['name', 'description']);
            setErros(porCampo);
            setMensagem(Object.keys(porCampo).length > 0 ? null : erro.message);
          } else {
            setMensagem('Não foi possível criar a categoria.');
          }
        },
      },
    );
  }

  return (
    <>
      <h1>Categorias</h1>
      <p className="subtitulo">Os tipos de ação sustentável que as pessoas escolhem ao publicar. Só administradores mexem aqui.</p>

      <div className="admin-grade">
        <section aria-labelledby="titulo-nova" className="bloco-conta">
          <h2 id="titulo-nova">Nova categoria</h2>
          <form ref={formRef} onSubmit={enviar} noValidate className="cartao-form form-conta">
            {mensagem && (
              <div role="alert" tabIndex={-1} className="aviso-erro">
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
            <button type="submit" className="btn" disabled={criar.isPending}>
              {criar.isPending ? 'Criando…' : 'Criar categoria'}
            </button>
            {criada && (
              <p role="status" className="sucesso">
                {criada}
              </p>
            )}
          </form>
        </section>

        <section aria-labelledby="titulo-lista" className="bloco-conta">
          <h2 id="titulo-lista">Categorias existentes{categorias.data ? ` (${categorias.data.length})` : ''}</h2>
          {categorias.isPending && <p role="status">Carregando categorias…</p>}
          {categorias.isError && (
            <div role="alert" className="aviso-erro">
              <p>Não consegui carregar as categorias. {categorias.error.message}</p>
              <button type="button" className="btn" onClick={() => void categorias.refetch()}>
                Tentar de novo
              </button>
            </div>
          )}
          {categorias.data && categorias.data.length === 0 && <p className="vazio">Nenhuma categoria ainda. Crie a primeira ao lado.</p>}
          {categorias.data && categorias.data.length > 0 && (
            <ul className="lista-categorias">
              {categorias.data.map((c) => (
                <CategoriaItem
                  key={c.id}
                  categoria={c}
                  modo={aberta?.id === c.id ? aberta.modo : 'ver'}
                  onModo={(modo) => setAberta(modo === 'ver' ? null : { id: c.id, modo })}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
