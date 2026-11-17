// Endereço da API. Em desenvolvimento aponta para a API local; na versão publicada,
// para a API do Render (a menos que VITE_API_URL diga outra coisa).
const padrao = import.meta.env.PROD ? 'https://ecomedia-api.onrender.com' : 'http://localhost:3333';

export const API_URL: string = (import.meta.env.VITE_API_URL || padrao).replace(/\/+$/, '');
