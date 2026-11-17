import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { Field } from '../components/Field';
import { destinoDepoisDeEntrar } from '../lib/navigation';
import { useFocusOnError } from '../lib/useFocusOnError';
import { errosDaApi, validarEntrada, type Erros } from '../lib/validation';

export function Entrar() {
  const { user, login, sessionExpired } = useAuth();
  const location = useLocation();
  const [valores, setValores] = useState({ email: '', password: '' });
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erros, mensagem);

  if (user) return <Navigate to={destinoDepoisDeEntrar(location.state)} replace />;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const locais = validarEntrada(valores);
    setMensagem(null);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    setEnviando(true);
    try {
      await login(valores.email.trim(), valores.password);
    } catch (erro) {
      if (!(erro instanceof ApiError)) throw erro;
      const porCampo = errosDaApi(erro, ['email', 'password']);
      setErros(porCampo);
      setMensagem(Object.keys(porCampo).length > 0 ? null : erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cartao-form">
      <h1>Entrar</h1>

      {sessionExpired && (
        <p role="status" className="aviso">
          Sua sessão expirou. Entre de novo para continuar.
        </p>
      )}

      <form ref={formRef} onSubmit={enviar} noValidate>
        {mensagem && (
          <div role="alert" tabIndex={-1} className="aviso-erro">
            {mensagem}
          </div>
        )}
        <Field
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          value={valores.email}
          onChange={(e) => setValores({ ...valores, email: e.target.value })}
          error={erros.email}
        />
        <Field
          label="Senha"
          type="password"
          name="password"
          autoComplete="current-password"
          value={valores.password}
          onChange={(e) => setValores({ ...valores, password: e.target.value })}
          error={erros.password}
        />
        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="rodape-form">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" state={location.state}>
          Criar conta
        </Link>
      </p>
    </section>
  );
}
