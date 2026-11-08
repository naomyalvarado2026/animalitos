import { motion } from 'motion/react';
import { X, Printer, ShieldCheck, Footprints, AlertTriangle, PhoneCall, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VolunteerWelcomeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#171717]/10 bg-[#fffdf9] p-6 text-[#171717] shadow-2xl sm:p-9"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar guía de bienvenida"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ede5da] text-[#171717] transition hover:bg-[#171717] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#f0644a]/20 bg-[#f0644a]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.14em] text-[#f0644a]">
          <Sparkles className="h-3.5 w-3.5" /> Manual de Bienvenida
        </div>

        <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-[-.04em] text-[#171717] sm:text-4xl">
          Guía Rápida del Voluntario AdoptaME
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6e6a64]">
          Todo lo que necesitas saber antes de tu primera jornada. Consérvala a mano o imprímela.
        </p>

        <div className="mt-8 space-y-6 text-sm">
          {/* Section 1: Qué vestir y traer */}
          <div className="rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-5">
            <h3 className="font-heading text-base font-bold text-[#171717] flex items-center gap-2">
              <Footprints className="h-4 w-4 text-[#f0644a]" /> 1. ¿Qué vestir y qué traer en tu mochila?
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#4f4a45]">
              <li>
                <strong>• Calzado cerrado con suela antideslizante:</strong> Zapatillas deportivas o botas de trekking. No se permite calzado abierto ni tacones.
              </li>
              <li>
                <strong>• Ropa cómoda y resistente:</strong> Pantalón largo preferiblemente (jeans o deportivos). Ven preparado para recibir lametazos y huellitas felices.
              </li>
              <li>
                <strong>• Hidratación y protección solar:</strong> Botella de agua recargable, gorra o sombrero y bloqueador solar para jornadas de paseo.
              </li>
              <li>
                <strong>• Actitud empática y paciencia:</strong> Cada perro tiene un ritmo único para confiar.
              </li>
            </ul>
          </div>

          {/* Section 2: Las 5 Reglas de Oro */}
          <div className="rounded-2xl border border-[#171717]/10 bg-white p-5 shadow-xs">
            <h3 className="font-heading text-base font-bold text-[#171717] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> 2. Las 5 Reglas de Oro con los Perros
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-[#4f4a45]">
              <p>
                <strong>1. Presentación respetuosa:</strong> Permite que el perro se acerque a olerte primero. No lo abraces de golpe ni toques su cabeza sin aviso.
              </p>
              <p>
                <strong>2. Manejo positivo innegociable:</strong> Jamás se grita ni se tira bruscamente de la correa. Premiamos la calma y premiamos la cooperación voluntaria.
              </p>
              <p>
                <strong>3. Correas seguras:</strong> En los paseos exteriores usamos doble fijación o arnés ajustado por un coordinador del refugio.
              </p>
              <p>
                <strong>4. Consulta antes de premiar:</strong> Algunos perros tienen dietas gastrointestinales estrictas o alergias; no des comida casera sin autorización previa.
              </p>
              <p>
                <strong>5. Lee las señales de calma:</strong> Si un perro bosteza repetidamente, mira hacia otro lado o se pone tenso, da un paso atrás y consulta con tu mentor.
              </p>
            </div>
          </div>

          {/* Section 3: Qué hacer ante imprevistos */}
          <div className="rounded-2xl border border-[#f0644a]/20 bg-[#fff5f2] p-5">
            <h3 className="font-heading text-base font-bold text-[#9b321f] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#f0644a]" /> 3. Qué hacer ante una duda o imprevisto
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#783023]">
              Si un perro se asusta, ladra a otro animal o la correa se engancha, mantén la calma, habla en tono suave, no tires con fuerza y llama inmediatamente a tu voluntario mentor o coordinador de turno. Nunca estás solo en el refugio.
            </p>
          </div>

          {/* Section 4: Contacto directo */}
          <div className="rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-5">
            <h3 className="font-heading text-base font-bold text-[#171717] flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-[#f0644a]" /> 4. Canales de coordinación y comunidad
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4f4a45]">
              Los horarios de voluntariado se confirman en el grupo oficial de WhatsApp. Para cualquier cambio de planes o coordinación especial, avísanos con al menos 24 horas de anticipación para reprogramar los paseos de tu perrito asignado.
            </p>
          </div>
        </div>

        {/* Modal actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#171717]/10 pt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-[#171717]"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir o Guardar en PDF
          </Button>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-[#171717] text-white hover:bg-[#38332f]"
          >
            Entendido, cerrar guía
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
