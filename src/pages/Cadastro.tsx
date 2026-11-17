import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { Field } from '../components/Field';
import { destinoDepoisDeEntrar } from '../lib/navigation';
import { useFocusOnError } from '../lib/useFocusOnError';
import { errosDaApi, validarCadastro, type Erros } from '../lib/validation';

const CAMPOS = ['name', 'email', 'password', 'city'];

export function Cadastro() {
  const { user, register } = useAuth();
  const location = useLocation();
  const [valores, setValores] = useState({ name: '', email: '', password: '', city: '' });
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erros, mensagem);

  if (user) return <Navigate to={destinoDepoisDeEntrar(location.state)} replace />;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const locais = validarCadastro(valores);
    setMensagem(null);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    setEnviando(true);
    try {
      await register({
        name: valores.name.trim(),
        email: valores.email.trim(),
        password: valores.password,
        city: valores.city,
      });
    } catch (erro) {
      if (!(erro instanceof ApiError)) throw erro;
      const porCampo = errosDaApi(erro, CAMPOS);
      setErros(porCampo);
      setMensagem(Object.keys(porCampo).length > 0 ? null : erro.message);
    } finally {
      setEnviando(false);
    }
  }

  const mudar = (campo: keyof typeof valores) => (e: { target: { value: string } }) =>
    setValores({ ...valores, [campo]: e.target.value });

  return (
    <section className="cartao-form">
      <h1>Criar conta</h1>

      <form ref={formRef} onSubmit={enviar} noValidate>
        {mensagem && (
          <div role="alert" tabIndex={-1} className="aviso-erro">
            {mensagem}
          </div>
        )}
        <Field label="Nome" name="name" autoComplete="name" value={valores.name} onChange={mudar('name')} error={erros.name} />
        <Field
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          value={valores.email}
          onChange={mudar('email')}
          error={erros.email}
        />
        <Field
          label="Senha"
          type="password"
          name="password"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
          value={valores.password}
          onChange={mudar('password')}
          error={erros.password}
        />
        <Field
          label="Cidade (opcional)"
          name="city"
          autoComplete="address-level2"
          value={valores.city}
          onChange={mudar('city')}
          error={erros.city}
        />
        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="rodape-form">
        Já tem conta?{' '}
        <Link to="/entrar" state={location.state}>
          Entrar
        </Link>
      </p>
    </section>
  );
}
