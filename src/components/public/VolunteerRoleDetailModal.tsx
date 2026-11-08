import { motion } from 'motion/react';
import { X, Clock, MapPin, Zap, CheckCircle2, Heart, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { VolunteerRoleDetail } from '@/data/volunteerRoles';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import type { VolunteerArea } from '@/types';

export function VolunteerRoleDetailModal({
  role,
  onClose,
  onSelectRole,
}: {
  role: VolunteerRoleDetail;
  onClose: () => void;
  onSelectRole: (role: VolunteerArea) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#171717]/10 bg-[#fffdf9] p-6 text-[#171717] shadow-2xl sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar detalles del rol"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ede5da] text-[#171717] transition hover:bg-[#171717] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Role Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-4xl" aria-hidden="true">
              {role.icon}
            </span>
            <Badge variant="warm" className="bg-[#f0644a] text-white">
              {role.badge}
            </Badge>
            <Badge variant="outline" className="border-[#171717]/15">
              Intensidad: {role.energyLevel}
            </Badge>
          </div>

          <h2 className="font-heading text-3xl font-extrabold tracking-[-.04em] text-[#171717] sm:text-4xl">
            {role.title}
          </h2>

          <p className="text-base leading-relaxed text-[#4f4a45]">{role.shortDesc}</p>
        </div>

        {/* Practical info pills */}
        <div className="mt-6 grid gap-3 rounded-2xl bg-[#f8f4ee] p-4 text-xs sm:grid-cols-2">
          <div className="flex items-center gap-2 text-[#4f4a45]">
            <Clock className="h-4 w-4 text-[#f0644a]" />
            <span>
              <strong>Tiempo:</strong> {role.timeCommitment}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#4f4a45]">
            <MapPin className="h-4 w-4 text-[#f0644a]" />
            <span>
              <strong>Lugar:</strong> {role.location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#4f4a45]">
            <Zap className="h-4 w-4 text-[#f0644a]" />
            <span>
              <strong>Nivel de esfuerzo:</strong> {role.energyLevel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#4f4a45]">
            <UserCheck className="h-4 w-4 text-[#f0644a]" />
            <span>
              <strong>Acompañamiento:</strong> Mentor voluntario siempre presente
            </span>
          </div>
        </div>

        {/* A typical day / shift */}
        <div className="mt-8">
          <h3 className="font-heading text-lg font-bold text-[#171717] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f0644a]" /> Un día típico en esta tarea
          </h3>
          <div className="mt-4 space-y-3 border-l-2 border-[#f0644a]/30 pl-4">
            {role.typicalDay.map((step, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#f0644a]" />
                <span className="text-xs font-bold text-[#f0644a]">{step.time}</span>
                <p className="text-xs text-[#2b2723] leading-relaxed">{step.activity}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-8">
          <h3 className="font-heading text-lg font-bold text-[#171717]">Requisitos y qué traer</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {role.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#4f4a45]">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The dog who benefits most */}
        <div className="mt-8 rounded-2xl border border-[#171717]/10 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border">
              <ResilientImage
                src={assetUrl(role.benefitedDogImage)}
                alt={role.benefitedDogName}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f0644a]">
                El impacto en la manada
              </p>
              <h4 className="font-heading text-base font-extrabold text-[#171717]">
                {role.benefitedDogName} y sus compañeros
              </h4>
              <p className="mt-1 text-xs text-[#6e6a64] leading-relaxed">
                {role.benefitedDogReason}
              </p>
            </div>
          </div>
        </div>

        {/* Volunteer Quote */}
        <blockquote className="mt-6 rounded-2xl bg-[#ffcf5a]/15 border border-[#ffcf5a]/40 p-4 text-xs italic text-[#4a3e21]">
          "{role.quote.text}"
          <span className="mt-1.5 block font-bold not-italic text-[#171717]">
            — {role.quote.author}, <span className="opacity-75">{role.quote.role}</span>
          </span>
        </blockquote>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={onClose} className="text-xs">
            Volver a la página
          </Button>
          <Button
            size="lg"
            onClick={() => {
              onSelectRole(role.id);
              onClose();
            }}
            className="bg-[#f0644a] text-white hover:bg-[#e94f3a]"
          >
            <Heart className="mr-2 h-4 w-4" />
            Elegir este rol y completar mi postulación
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
