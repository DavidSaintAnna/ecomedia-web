import { useState } from 'react';

// Foto da pessoa; se não houver foto ou o link estiver quebrado, mostra a inicial do nome.
export function Avatar({ name, url }: { name: string; url: string | null }) {
  const [falhou, setFalhou] = useState(false);

  if (url && !falhou) {
    return <img className="avatar" src={url} alt="" loading="lazy" onError={() => setFalhou(true)} />;
  }
  return (
    <span className="avatar avatar-inicial" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
