'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, PhoneCall } from 'lucide-react';

type CallState = 'idle' | 'initializing' | 'calling' | 'connected' | 'ended' | 'error';

interface Props {
  contactName: string;
  contactPhone: string;
  ticketId: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VoiceCallPanel({ contactName, contactPhone, ticketId }: Props) {
  const [open, setOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // ACS SDK refs — loaded dynamically to avoid SSR issues
  const callClientRef = useRef<import('@azure/communication-calling').CallClient | null>(null);
  const callAgentRef = useRef<import('@azure/communication-calling').CallAgent | null>(null);
  const activeCallRef = useRef<import('@azure/communication-calling').Call | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Log call end as internal comment
  const logCallEnd = useCallback(async (durationSecs: number) => {
    await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: `Appel vocal avec ${contactName} (${contactPhone}) — durée : ${formatDuration(durationSecs)}`,
        isInternal: true,
      }),
    });
  }, [ticketId, contactName, contactPhone]);

  const hangup = useCallback(async () => {
    if (activeCallRef.current) {
      await activeCallRef.current.hangUp({ forEveryone: false });
    }
  }, []);

  const toggleMute = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) return;
    if (muted) { await call.unmute(); setMuted(false); }
    else { await call.mute(); setMuted(true); }
  }, [muted]);

  const initiateCall = useCallback(async () => {
    setCallState('initializing');
    setErrorMsg('');

    try {
      // Lazy-load SDK
      const [{ CallClient }, { AzureCommunicationTokenCredential }] = await Promise.all([
        import('@azure/communication-calling'),
        import('@azure/communication-common'),
      ]);

      // Get ACS token from server
      const res = await fetch('/api/acs/token');
      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        throw new Error(error);
      }
      const { token } = await res.json() as { token: string };

      const callClient = new CallClient();
      callClientRef.current = callClient;

      const tokenCredential = new AzureCommunicationTokenCredential(token);
      const callAgent = await callClient.createCallAgent(tokenCredential, { displayName: 'Agent CRM' });
      callAgentRef.current = callAgent;

      setCallState('calling');

      const call = callAgent.startCall(
        [{ phoneNumber: contactPhone }],
        { alternateCallerId: { phoneNumber: process.env.NEXT_PUBLIC_ACS_CALLER_ID ?? '' } }
      );
      activeCallRef.current = call;

      call.on('stateChanged', () => {
        const state = call.state;
        if (state === 'Connected') {
          setCallState('connected');
          startTimer();
        } else if (state === 'Disconnected') {
          stopTimer();
          setDuration((prev) => {
            void logCallEnd(prev);
            return prev;
          });
          setCallState('ended');
          activeCallRef.current = null;
        }
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setCallState('error');
    }
  }, [contactPhone, startTimer, stopTimer, logCallEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      void activeCallRef.current?.hangUp({ forEveryone: false });
      void callAgentRef.current?.dispose();
    };
  }, [stopTimer]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 w-full justify-center"
      >
        <Phone className="h-4 w-4" />
        Appeler {contactName}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
      {/* Contact */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <PhoneCall className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{contactName}</p>
          <p className="text-xs text-gray-500 font-mono">{contactPhone}</p>
        </div>

        {callState === 'connected' && (
          <span className="ml-auto font-mono text-sm font-bold text-emerald-700 tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Status */}
      {callState === 'idle' && (
        <button
          onClick={() => void initiateCall()}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Phone className="h-4 w-4" /> Démarrer l'appel
        </button>
      )}

      {callState === 'initializing' && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Initialisation…
        </div>
      )}

      {callState === 'calling' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-amber-700 font-medium animate-pulse">Appel en cours…</span>
          <button onClick={() => void hangup()} className="flex items-center gap-1.5 rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700 transition-colors">
            <PhoneOff className="h-4 w-4" /> Raccrocher
          </button>
        </div>
      )}

      {callState === 'connected' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => void toggleMute()}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              muted ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {muted ? 'Activer' : 'Couper'}
          </button>
          <button onClick={() => void hangup()} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 text-white py-2 text-sm font-semibold hover:bg-red-700 transition-colors">
            <PhoneOff className="h-4 w-4" /> Raccrocher
          </button>
        </div>
      )}

      {callState === 'ended' && (
        <div className="space-y-2">
          <p className="text-sm text-center text-gray-500">
            Appel terminé — durée : <strong>{formatDuration(duration)}</strong>
          </p>
          <button
            onClick={() => { setCallState('idle'); setDuration(0); }}
            className="w-full rounded-xl bg-gray-100 text-gray-700 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Nouvel appel
          </button>
        </div>
      )}

      {callState === 'error' && (
        <div className="space-y-2">
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg || 'Erreur ACS'}</p>
          <button
            onClick={() => { setCallState('idle'); setErrorMsg(''); }}
            className="w-full rounded-xl bg-gray-100 text-gray-700 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      <button
        onClick={() => { void hangup(); setOpen(false); setCallState('idle'); setDuration(0); }}
        className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Fermer le panneau
      </button>
    </div>
  );
}
