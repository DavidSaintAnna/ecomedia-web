import { useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useUpdateProfile } from '../api/hooks';
import type { AuthUser } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { corpoPerfil, valoresDoPerfil, type ValoresPerfil } from '../lib/perfilBody';
import { useFocusOnError } from '../lib/useFocusOnError';
import { BIO_MAXIMO, errosDaApi, validarPerfil, type Erros } from '../lib/validation';
import { FOTO_DE_PERFIL } from '../lib/imagem';
import { EscolherFoto } from './EscolherFoto';
import { Field } from './Field';
import { TextArea } from './TextArea';

const CAMPOS = ['name', 'city', 'bio', 'avatarUrl'];

export function EditarPerfil({ user }: { user: AuthUser }) {
  const { updateUser } = useAuth();
  const atualizar = useUpdateProfile();
  const [valores, setValores] = useState<ValoresPerfil>(() => valoresDoPerfil(user));
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erros, mensagem);

  function mudar(campo: keyof ValoresPerfil, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setSalvo(false);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (atualizar.isPending || enviandoFoto) return;
    setSalvo(false);
    setMensagem(null);
    const locais = validarPerfil(valores);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    const corpo = corpoPerfil(user, valores);
    if (Object.keys(corpo).length === 0) return setMensagem('Você não alterou nada.');

    atualizar.mutate(corpo, {
      onSuccess: (perfil) => {
        updateUser({ name: perfil.name, city: perfil.city, bio: perfil.bio, avatarUrl: perfil.avatarUrl });
        setValores({ name: perfil.name, city: perfil.city ?? '', bio: perfil.bio ?? '', avatarUrl: perfil.avatarUrl ?? '' });
        setSalvo(true);
      },
      onError: (erro) => {
        if (erro instanceof ApiError) {
          const porCampo = errosDaApi(erro, CAMPOS);
          setErros(porCampo);
          setMensagem(Object.keys(porCampo).length > 0 ? null : erro.message);
        } else {
          setMensagem('Não foi possível salvar.');
        }
      },
    });
  }

  return (
    <section aria-labelledby="titulo-editar" className="bloco-conta">
      <h2 id="titulo-editar">Editar perfil</h2>
      <form ref={formRef} onSubmit={enviar} noValidate className="cartao-form cartao-form-largo form-conta">
        {mensagem && (
          <div role="alert" tabIndex={-1} className="aviso-erro">
            {mensagem}
          </div>
        )}
        <Field label="Nome" name="name" autoComplete="name" value={valores.name} onChange={(e) => mudar('name', e.target.value)} error={erros.name} />
        <Field label="Cidade (opcional)" name="city" autoComplete="address-level2" value={valores.city} onChange={(e) => mudar('city', e.target.value)} error={erros.city} />
        <TextArea
          label="Sobre você (opcional)"
          name="bio"
          rows={4}
          value={valores.bio}
          onChange={(e) => mudar('bio', e.target.value)}
          error={erros.bio}
          contador={{ atual: valores.bio.length, maximo: BIO_MAXIMO }}
        />
        <EscolherFoto
          name="avatarUrl"
          rotuloLink="Link da sua foto (opcional)"
          dicaLink="Ou cole o endereço de uma foto que já está na internet, começando com https://"
          rotuloBotao="Escolher foto do computador"
          reducao={FOTO_DE_PERFIL}
          redonda
          valor={valores.avatarUrl}
          onChange={(link) => mudar('avatarUrl', link)}
          onOcupado={setEnviandoFoto}
          erro={erros.avatarUrl}
        />
        <button type="submit" className="btn" disabled={atualizar.isPending || enviandoFoto}>
          {atualizar.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
        {salvo && (
          <p role="status" className="sucesso">
            Perfil atualizado.
          </p>
        )}
      </form>
    </section>
  );
}
