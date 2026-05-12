'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">CRM Pro</span>
        </div>
        <div className="space-y-6">
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed">
            &ldquo;Centralisez vos contacts, suivez vos opportunités et accélérez votre croissance commerciale.&rdquo;
          </blockquote>
          <div className="flex gap-3">
            {[
              { label: 'Contacts', value: 'Illimités' },
              { label: 'Pipeline', value: 'Temps réel' },
              { label: 'Sécurité', value: 'Enterprise' },
            ].map((item) => (
              <div key={item.label} className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-sm">{item.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">© 2026 CRM Pro — Tous droits réservés</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">CRM Pro</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bon retour 👋</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Connectez-vous à votre espace de travail</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="email">Adresse email</label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                placeholder="vous@exemple.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">Mot de passe</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl gradient-primary text-white px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-indigo-200 mt-2"
            >
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Compte de démonstration</p>
            <p className="text-xs text-blue-600 font-mono">admin@crm.dev · admin1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
