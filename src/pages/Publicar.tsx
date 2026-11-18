import { useNavigate } from 'react-router';
import { useCreatePost } from '../api/hooks';
import { useAuth } from '../auth/auth-context';
import { PostForm } from '../components/PostForm';
import { corpoNovo, valoresIniciais } from '../lib/postBody';

export function Publicar() {
  const { user } = useAuth();
  const criar = useCreatePost();
  const navigate = useNavigate();

  return (
    <PostForm
      titulo="Nova publicação"
      inicial={valoresIniciais()}
      rotuloEnviar="Publicar"
      rotuloEnviando="Publicando…"
      dicaCidade={
        user?.city
          ? `Se deixar em branco, usamos a cidade do seu perfil (${user.city}).`
          : 'Onde isso aconteceu? Pode deixar em branco.'
      }
      voltarPara="/explorar"
      onEnviar={async (valores) => {
        const criado = await criar.mutateAsync(corpoNovo(valores));
        navigate(`/posts/${criado.id}`);
      }}
    />
  );
}
