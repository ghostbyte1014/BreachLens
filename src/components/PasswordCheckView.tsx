import React, { useState } from 'react';
import { PasswordCheckResult } from '../types';
import { checkPwnedPassword } from '../lib/api';
import { KeyRound, ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react';

export const PasswordCheckView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PasswordCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await checkPwnedPassword(password);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to check password exposure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Check a password</h1>
        <p className="text-ink-soft max-w-2xl">
          Your password is hashed locally on this device. Only the first five characters of that hash are ever transmitted to the Pwned Passwords API — the full password and full hash never leave your browser.
        </p>
      </div>

      <form onSubmit={handleCheck} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a password to check"
            required
            className="flex-1 px-3.5 py-2.5 bg-paper-card border border-line rounded font-sans text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? 'Hashing locally...' : 'Check password'}
          </button>
        </div>
        <p className="font-mono text-xs text-ink-faint">
          Hashes your password inside your browser first — your actual password is never transmitted over the internet.
        </p>
      </form>

      {error && (
        <div className="p-4 rounded border bg-accent-tint text-accent-dark border-l-4 border-l-accent border-line text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className={`bg-paper-card border rounded-lg p-6 space-y-4 shadow-xs ${
          result.count > 0 ? 'border-accent/40' : 'border-resolve/40'
        }`}>
          <div className="flex items-center gap-2">
            {result.count > 0 ? (
              <>
                <ShieldAlert className="w-5 h-5 text-accent" />
                <h3 className="font-serif text-lg font-medium text-accent-dark">
                  This password has been seen before
                </h3>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-resolve" />
                <h3 className="font-serif text-lg font-medium text-resolve">
                  No matches found in known breach corpus
                </h3>
              </>
            )}
          </div>

          <p className="text-sm text-ink-soft leading-relaxed">
            {result.count > 0 ? (
              <>
                It has appeared in known breach data <strong className="text-accent-dark font-semibold">{result.count.toLocaleString()}</strong> time{result.count === 1 ? '' : 's'}. Treat it as compromised — change it anywhere it's reused, starting with your most sensitive accounts.
              </>
            ) : (
              <>
                It didn't turn up in this corpus. That's a good sign, but not a lifetime guarantee — password reuse still carries risk if it ever appears in a future leak.
              </>
            )}
          </p>

          <div className="pt-3 border-t border-line flex flex-wrap gap-4 font-mono text-xs text-ink-faint">
            <span>length: <strong className="text-ink">{result.length}</strong></span>
            <span>letters: <strong className="text-ink">{result.hasLetter ? 'yes' : 'no'}</strong></span>
            <span>digits: <strong className="text-ink">{result.hasDigit ? 'yes' : 'no'}</strong></span>
            <span>special chars: <strong className="text-ink">{result.hasSpecial ? 'yes' : 'no'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
