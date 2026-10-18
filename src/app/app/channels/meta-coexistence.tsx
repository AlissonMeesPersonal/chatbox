'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, ShieldCheck, Smartphone, MessageSquare, History, LockKeyhole, CheckCircle2 } from 'lucide-react';

type Unit = { id: string; name: string };
type FBResponse = { authResponse?: { code?: string } };
type FacebookSdk = {
  init: (args: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
  login: (cb: (res: FBResponse) => void, options: Record<string, unknown>) => void;
};
type SignupEvent = {
  type?: string;
  event?: string;
  data?: { waba_id?: string; phone_number_id?: string };
};
type MetaWindow = Window & { FB?: FacebookSdk };
const AUTHORIZED_ORIGINS = new Set(['https://www.facebook.com', 'https://web.facebook.com', 'https://business.facebook.com']);
const ID = /^\d{5,30}$/;

export function MetaCoexistence({
  units, organizationId, metaAppId, configId, enabled, graphVersion,
}: {
  units: Unit[];
  organizationId: string;
  metaAppId: string | null;
  configId: string | null;
  enabled: boolean;
  graphVersion: string;
}) {
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [consent, setConsent] = useState(false);
  const [historyConsent, setHistoryConsent] = useState(false);
  const [status, setStatus] = useState('');
  const sessionRef = useRef<{ wabaId?: string; phoneId?: string }>({});
  const codeRef = useRef('');

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!AUTHORIZED_ORIGINS.has(event.origin) || typeof event.data !== 'string' || event.data.length > 16000) return;
      try {
        const message = JSON.parse(event.data) as SignupEvent;
        if (message.type !== 'WA_EMBEDDED_SIGNUP') return;
        if (!message.event?.startsWith('FINISH') || !message.data) return;
        const { waba_id, phone_number_id } = message.data;
        if (waba_id && ID.test(waba_id)) sessionRef.current.wabaId = waba_id;
        if (phone_number_id && ID.test(phone_number_id)) sessionRef.current.phoneId = phone_number_id;
      } catch {
        // Meta sends unrelated postMessage events; ignore them.
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const initSdk = useCallback(() => {
    const fb = (window as MetaWindow).FB;
    if (!fb || !metaAppId) return;
    fb.init({ appId: metaAppId, autoLogAppEvents: false, xfbml: false, version: graphVersion });
    setSdkReady(true);
  }, [metaAppId, graphVersion]);

  async function complete(code: string) {
    // Wait briefly for Meta's sessionInfo postMessage, which may arrive after FB.login's code.
    await new Promise(resolve => setTimeout(resolve, 1200));
    const body = {
      organization_id: organizationId,
      unit_id: unitId,
      code,
      waba_id: sessionRef.current.wabaId ?? '',
      phone_number_id: sessionRef.current.phoneId ?? '',
      requested_history_import: historyConsent,
    };
    try {
      const response = await fetch('/app/channels/coexistence/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(typeof data.error === 'string' ? data.error : 'A Meta não concluiu a vinculação. Confira as configurações.');
        return;
      }
      setStatus('Número verificado e vinculado à unidade! A conexão de recebimento está preparada. Respostas automáticas continuam desligadas até a configuração da Vi.');
      window.location.assign('/app/channels?org=' + encodeURIComponent(organizationId) + '&status=connected');
    } catch {
      setStatus('Não foi possível concluir a autorização com a Meta. Tente novamente.');
    } finally {
      setBusy(false);
      codeRef.current = '';
    }
  }

  function connect() {
    const fb = (window as MetaWindow).FB;
    if (!fb || !unitId || !consent || !enabled || !configId || busy) return;
    sessionRef.current = {};
    codeRef.current = '';
    setBusy(true);
    setStatus('Abrindo a autorização oficial da Meta...');
    // FB.login must run synchronously within this click handler for popup blockers.
    fb.login(response => {
      const code = response.authResponse?.code;
      if (!code) {
        setStatus('A conexão não foi concluída na Meta. Nenhuma conta foi vinculada.');
        setBusy(false);
        return;
      }
      codeRef.current = code;
      setStatus('Validando a autorização e o número com a Meta...');
      void complete(code);
    }, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: 'whatsapp_business_app_onboarding',
      },
    });
  }

  const configured = Boolean(enabled && metaAppId && configId);
  return <section style={{ padding: 'clamp(18px,3vw,27px)', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 15 }}>
    {configured && <Script src="https://connect.facebook.net/pt_BR/sdk.js" strategy="afterInteractive" onLoad={initSdk}/>}
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
      <div>
        <span className="eyebrow">META · CONEXÃO OFICIAL</span>
        <h2 style={{ fontSize: 24, margin: '8px 0 6px' }}>Conectar meu WhatsApp Business</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>Use o mesmo número do seu aplicativo, mediante autorização oficial da Meta. O QR apresentado pela Meta não é o QR do WhatsApp Web.</p>
      </div>
      <span className="badge">{configured ? sdkReady ? 'Integração configurada' : 'Preparando a Meta' : 'Aguardando configuração da Meta'}</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 12, marginTop: 20 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 15 }}><Smartphone size={21} color="var(--accent)"/><p style={{ marginTop: 9, fontWeight: 600 }}>Mesmo número</p><p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 7 }}>WhatsApp Business no celular e plataforma Viante, se elegível.</p></div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 15 }}><History size={21} color="var(--accent)"/><p style={{ marginTop: 9, fontWeight: 600 }}>Histórico limitado</p><p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 7 }}>Até 180 dias de conversas individuais, se a Meta disponibilizar a sincronização e você autorizar.</p></div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 15 }}><MessageSquare size={21} color="var(--accent)"/><p style={{ marginTop: 9, fontWeight: 600 }}>Vi sob controle</p><p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 7 }}>A automação não será ativada sem regras e autorização explícitas.</p></div>
    </div>
    {!configured
      ? <div style={{ marginTop: 22, padding: 17, borderRadius: 10, background: 'var(--elevated)', display: 'grid', gap: 10 }} role="status">
        <strong>O aplicativo Meta ainda não está pronto para este tipo de conexão</strong>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--muted)' }}>
          Precisamos habilitar o WhatsApp Embedded Signup/Coexistence na conta de desenvolvedor do Viante e configurar
          as credenciais do aplicativo na Vercel. Depois disso, o botão abaixo abrirá a autorização real da Meta.
          Não é possível emitir um QR de pareamento válido sem essa autorização.
        </p>
        <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
          className="button" style={{ width: 'fit-content' }}>Configurar aplicativo Meta <ExternalLink size={15}/></a>
      </div>
      : <>
        <div style={{ display: 'grid', gap: 14, marginTop: 22, maxWidth: 560 }}>
          <label style={{ display: 'grid', gap: 7 }}>Unidade que receberá as conversas
            <select value={unitId} onChange={e=>setUnitId(e.target.value)} disabled={busy}>
              {units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.6 }}>
            <input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)} style={{ marginTop: 3 }}/>
            Autorizo vincular o WhatsApp Business desta unidade à plataforma Viante pela Meta. Entendo que a Meta realizará a verificação do número e poderá alterar recursos do aplicativo.
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.6 }}>
            <input type="checkbox" checked={historyConsent} disabled={busy} onChange={e=>setHistoryConsent(e.target.checked)} style={{ marginTop: 3 }}/>
            Desejo importar o histórico elegível. A confirmação efetiva de compartilhamento será feita dentro do fluxo da Meta; a importação não é imediata nem garantida.
          </label>
          <button className="button primary" type="button" onClick={connect}
            disabled={!sdkReady || !consent || !unitId || busy}>
            <LockKeyhole size={16}/> {busy ? 'Aguardando a Meta...' : 'Autorizar conexão com a Meta'}
          </button>
        </div>
        {status && <p role="status" style={{ padding: 13, marginTop: 14, background: 'var(--elevated)', borderRadius: 9 }}>{status}</p>}
      </>
    }
    <p style={{ display: 'flex', gap: 8, marginTop: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--muted)' }}>
      <ShieldCheck size={17}/> Este fluxo não solicita o código de seis dígitos do WhatsApp nem escaneia dispositivos não oficiais. Grupos e histórico completo não são importados.
    </p>
  </section>;
}
