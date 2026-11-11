import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { ServiceSelect } from './ServiceSelect'
import { TimeSlotPicker } from './TimeSlotPicker'
import { ConfirmationStep } from './ConfirmationStep'
import { BookingSummary } from './BookingSummary'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const STEPS = [
  { number: 1, label: 'Servicio' },
  { number: 2, label: 'Fecha y hora' },
  { number: 3, label: 'Tus datos' },
]

function Stepper({ current, onNavigate }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 rounded-xl border border-line/80 bg-white/70 px-3 py-2 backdrop-blur-sm sm:px-4">
      {STEPS.map((step, index) => {
        const isComplete = step.number < current
        const isCurrent = step.number === current
        const canNavigate = isComplete

        return (
          <div key={step.number} className={cn('flex items-center', index < STEPS.length - 1 && 'flex-1')}>
            <button
              type="button"
              onClick={() => canNavigate && onNavigate(step.number)}
              disabled={!canNavigate}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Paso ${step.number}: ${step.label}`}
              className={cn(
                'flex items-center gap-2 text-left transition-opacity',
                canNavigate ? 'cursor-pointer hover:opacity-75' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-label-xs font-bold transition-colors',
                  isComplete && 'border-forest-800 bg-forest-800 text-paper-50',
                  isCurrent && 'border-forest-800 bg-forest-50 text-forest-900 ring-3 ring-forest-500/10',
                  !isComplete && !isCurrent && 'border-line bg-white text-muted/40',
                )}
              >
                {isComplete ? <Check className="h-3 w-3" aria-hidden="true" /> : step.number}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-label-xs font-semibold tracking-label sm:text-xs',
                  isCurrent ? 'text-forest-950' : isComplete ? 'text-forest-700' : 'text-muted/50',
                )}
              >
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  'mx-1 h-px flex-1 sm:mx-2',
                  step.number < current ? 'bg-forest-300' : 'bg-line',
                )}
                aria-hidden="true"
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function BookingFlow({ services, settings, isDemo }) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [isComplete, setIsComplete] = useState(false)

  const canContinue = step === 1 ? Boolean(selectedService) : Boolean(selectedDate && selectedTime)

  function handleServiceSelect(service) {
    if (service.id !== selectedService?.id) {
      setSelectedTime(null)
    }
    setSelectedService(service)
  }

  function goToStep(nextStep) {
    if (nextStep > step) return
    setIsComplete(false)
    setStep(nextStep)
  }

  function handleContinue() {
    if (step === 1 && selectedService) {
      setStep(2)
    } else if (step === 2 && selectedDate && selectedTime) {
      setStep(3)
    }
  }

  function handleReset() {
    setStep(1)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setIsComplete(false)
  }

  return (
    <div>
      {!isComplete ? <Stepper current={step} onNavigate={goToStep} /> : null}

      <div
        className={cn(
          'mt-5 grid items-start gap-7',
          !isComplete && 'lg:grid-cols-[minmax(0,1fr)_350px]',
        )}
      >
        <div className="min-w-0 overflow-hidden rounded-[2rem] border border-line bg-white shadow-card">
          <div key={step} className="animate-fade-up p-5 sm:p-7">
            {step === 1 ? (
              <ServiceSelect
                services={services}
                selectedId={selectedService?.id}
                onSelect={handleServiceSelect}
              />
            ) : null}

            {step === 2 && selectedService ? (
              <TimeSlotPicker
                service={selectedService}
                settings={settings}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />
            ) : null}

            {step === 3 && selectedService ? (
              <ConfirmationStep
                service={selectedService}
                dateKey={selectedDate}
                time={selectedTime}
                settings={settings}
                isDemo={isDemo}
                onBack={() => setStep(2)}
                onReset={handleReset}
                onBooked={() => setIsComplete(true)}
              />
            ) : null}
          </div>

          {step < 3 ? (
            <div className="flex items-center justify-between gap-3 border-t border-line/80 bg-paper-50/65 px-5 py-4 sm:px-7">
              <div>
                {step === 2 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Atrás
                  </Button>
                ) : (
                  <p className="hidden items-center gap-1.5 caption text-muted sm:flex">
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                    Reserva segura, sin pago online
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                size="lg"
              >
                {step === 1 ? 'Elegir fecha y hora' : 'Añadir mis datos'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>

        {!isComplete ? (
          <aside className="hidden lg:block">
            <BookingSummary
              service={selectedService}
              dateKey={selectedDate}
              time={selectedTime}
              className="sticky top-28"
            />
          </aside>
        ) : null}
      </div>

      {!isComplete ? (
        <div className="mt-6 lg:hidden">
          <BookingSummary
            service={selectedService}
            dateKey={selectedDate}
            time={selectedTime}
          />
        </div>
      ) : null}
    </div>
  )
}
