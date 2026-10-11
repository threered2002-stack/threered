'use client'

import { useState } from 'react'
import { register } from '@/modules/core/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await register({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
    })

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Register</h2>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            required
            className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/10 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
          />
        </div>

        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/10 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
          />
        </div>

        <div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 6 characters)"
            required
            className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/10 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
          />
        </div>

        <div>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/10 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-white hover:bg-neutral-200 text-black font-semibold rounded-full transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creando cuenta...
            </span>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-white font-semibold hover:text-neutral-300 transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </>
  )
}
