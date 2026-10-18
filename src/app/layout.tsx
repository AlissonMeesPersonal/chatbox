import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import './globals.css';
export const metadata: Metadata = { title: 'Viante — Toda conversa no lugar certo', description: 'Plataforma Viante de atendimento e gestão empresarial. A Inbox de demonstração utiliza dados fictícios.', robots: {index:false,follow:false} };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang="pt-BR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('viante-theme')==='light'?'light':'dark'}catch(e){}"}}/></head><body>{children}</body></html>;
}
