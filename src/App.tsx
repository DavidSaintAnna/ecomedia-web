import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { Cadastro } from './pages/Cadastro';
import { Conta } from './pages/Conta';
import { EditarPost } from './pages/EditarPost';
import { Feed } from './pages/Feed';
import { Entrar } from './pages/Entrar';
import { Explorar } from './pages/Explorar';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Pessoa } from './pages/Pessoa';
import { PostPage } from './pages/PostPage';
import { Publicar } from './pages/Publicar';
import { Ranking } from './pages/Ranking';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explorar" element={<Explorar />} />
        <Route path="posts/:id" element={<PostPage />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="pessoas/:id" element={<Pessoa />} />
        <Route path="entrar" element={<Entrar />} />
        <Route path="cadastro" element={<Cadastro />} />
        <Route element={<RequireAuth />}>
          <Route path="conta" element={<Conta />} />
          <Route path="feed" element={<Feed />} />
          <Route path="posts/novo" element={<Publicar />} />
          <Route path="posts/:id/editar" element={<EditarPost />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
