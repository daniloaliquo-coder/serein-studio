import { useState } from 'react'
import {
  ArrowLeft,
  CalendarCheck2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Brand } from '../ui/brand'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { DEFAULT_SETTINGS } from '../../lib/defaults'
import { getErrorMessage } from '../../lib/utils'

export function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.includes('@') || password.length < 6) {
      setError('Introduce un email válido y una contraseña de al menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)

    try {
      await onLogin(email, password)
    } catch (loginError) {
      setError(getErrorMessage(loginError, 'No pudimos iniciar sesión. Inténtalo de nuevo.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-cream-50 lg:grid-cols-[1.02fr_0.98fr]">
      <section className="relative hidden overflow-hidden bg-forest-950 p-12 text-cream-50 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="noise pointer-events-none absolute inset-0 opacity-[0.055]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full border border-cream-100/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-clay-400/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full border border-cream-100/10"
          aria-hidden="true"
        />

        <div className="relative">
          <Brand name={DEFAULT_SETTINGS.business_name} variant="dark" />
        </div>

        <div className="relative max-w-md py-16">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-clay-300/80">
            <span className="h-px w-8 bg-clay-300/50" aria-hidden="true" />
            Panel de gestión
          </p>
          <h1 className="mt-5 text-balance font-display text-5xl leading-[0.98] tracking-tight xl:text-6xl">
            Tu agenda,
            <span className="block font-light italic text-clay-200">más clara que nunca.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream-200/60">
            Reservas, confirmaciones y disponibilidad en un único lugar. Todo lo que necesitas
            para cuidar de tu estudio y de tu tiempo.
          </p>

          <div className="mt-9 space-y-4">
            {[
              { icon: CalendarCheck2, text: 'Agenda diaria y semanal de un vistazo' },
              { icon: Sparkles, text: 'Métricas clave del negocio, sin hojas de cálculo' },
              { icon: ShieldCheck, text: 'Acceso privado para el equipo del estudio' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-clay-200">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-xs text-cream-100/80">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-[10px] text-cream-200/40">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          Espacio privado · {DEFAULT_SETTINGS.business_name}
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Brand name={DEFAULT_SETTINGS.business_name} />
          </div>

          <a
            href="#/"
            className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-forest-900 lg:mt-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Volver al sitio público
          </a>

          <div className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-card sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-200 bg-forest-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-forest-700">
              <LockKeyhole className="h-3 w-3" aria-hidden="true" />
              Acceso privado
            </span>

            <h2 className="mt-5 font-display text-4xl tracking-tight text-forest-950">
              Bienvenida de nuevo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Inicia sesión con tu cuenta de equipo para gestionar la agenda.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-7">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60"
                      aria-hidden="true"
                    />
                    <Input
                      id="admin-email"
                      type="email"
                      name="email"
                      autoComplete="username"
                      placeholder="tu@estudio.com"
                      className="pl-10"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setError('')
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="admin-password">Contraseña</Label>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60"
                      aria-hidden="true"
                    />
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="px-10"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError('')
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-cream-100 hover:text-forest-900"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-700"
                >
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="mt-5 w-full"
                size="lg"
                isLoading={isSubmitting}
              >
                Entrar al panel
              </Button>
            </form>

            <p className="mt-5 border-t border-line/80 pt-4 text-center text-[10px] leading-relaxed text-muted/70">
              Si todavía no tienes acceso, solicita tus credenciales al administrador del
              estudio.
            </p>
          </div>

          <p className="mt-6 text-center text-[10px] text-muted/60">
            Protegido por Supabase Auth · {new Date().getFullYear()}
          </p>
        </div>
      </section>
    </div>
  )
}
