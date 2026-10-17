'use client';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
function subscribe(cb: () => void) { window.addEventListener('viante-theme',cb); return () => window.removeEventListener('viante-theme',cb); }
function snapshot() { return document.documentElement.dataset.theme || 'dark'; }
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe,snapshot,()=> 'dark');
  function toggle() { const next = theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; try { localStorage.setItem('viante-theme',next); } catch {} window.dispatchEvent(new Event('viante-theme')); }
  return <button className="icon-button" onClick={toggle} title="Alternar tema" aria-label="Alternar tema">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>;
}
