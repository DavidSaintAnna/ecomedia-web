import { Link } from 'react-router';
import type { Person } from '../api/types';
import { Avatar } from './Avatar';

export function ListaDePessoas({ pessoas }: { pessoas: Person[] }) {
  return (
    <ul className="lista-pessoas">
      {pessoas.map((p) => (
        <li key={p.id} className="pessoa-item">
          <Avatar name={p.name} url={p.avatarUrl} />
          <div>
            <Link to={`/pessoas/${p.id}`} className="link-pessoa pessoa-nome">
              {p.name}
            </Link>
            {p.city && <p className="post-meta">{p.city}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
