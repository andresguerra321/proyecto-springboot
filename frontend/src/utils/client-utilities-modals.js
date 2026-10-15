import modal from '../components/modal.js';
import { renderIcon } from './icons.js';

/**
 * Opens the interactive technical inspection and return protocol checklist modal.
 */
export function openTechnicalReturnGuideModal() {
  const guideContent = document.createElement('div');
  guideContent.className = 'p-6 sm:p-8 space-y-6 bg-white text-slate-800';
  guideContent.innerHTML = `
    <div class="space-y-2">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
        ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5')}
        Protocolo Técnico de Devolución
      </div>
      <h3 class="text-xl font-black text-slate-900 font-display">
        Guía de Entrega e Inspección de Maquinaria
      </h3>
      <p class="text-xs text-slate-500 leading-relaxed">
        Sigue esta lista de verificación al finalizar tu jornada de alquiler para asegurar la aprobación inmediata del acta técnica y el reintegro automático del 100% de tu depósito en custodia.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div class="font-bold text-slate-900 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
          Limpieza General
        </div>
        <p class="text-slate-600 leading-relaxed">
          Retirar lodo, exceso de polvo o restos de concreto fresco antes de la recolección del transporte.
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div class="font-bold text-slate-900 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
          Nivel de Fluidos
        </div>
        <p class="text-slate-600 leading-relaxed">
          Equipos a combustión deben retornar con el mismo nivel de combustible y aceite con el que fueron entregados.
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div class="font-bold text-slate-900 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
          Accesorios y Piezas
        </div>
        <p class="text-slate-600 leading-relaxed">
          Verificar brocas, cinceles, mangueras hidráulicas, llaves de ajuste y cargadores de baterías incluidos.
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div class="font-bold text-slate-900 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
          Acta Digital de Cierre
        </div>
        <p class="text-slate-600 leading-relaxed">
          El transportador y supervisor firman el acta de recepción digital. La plataforma libera el depósito en 24h.
        </p>
      </div>
    </div>

    <div class="pt-2 flex justify-end">
      <button id="btn-close-return-modal" type="button" class="btn-primary !py-2.5 !px-6 text-xs font-bold cursor-pointer">
        Entendido
      </button>
    </div>
  `;
  guideContent.querySelector('#btn-close-return-modal')?.addEventListener('click', () => modal.close());
  modal.open({
    title: '',
    content: guideContent,
    maxWidth: 'max-w-xl',
    hideHeader: true
  });
}

/**
 * Opens the emergency technical support in field modal.
 */
export function openEmergencySupportModal() {
  const supportContent = document.createElement('div');
  supportContent.className = 'p-6 sm:p-8 space-y-6 bg-white text-slate-800';
  supportContent.innerHTML = `
    <div class="space-y-2">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
        ${renderIcon('Wrench', 'w-3.5 h-3.5')}
        Soporte Operativo en Obra
      </div>
      <h3 class="text-xl font-black text-slate-900 font-display">
        Asistencia Técnica Inmediata ToolRent
      </h3>
      <p class="text-xs text-slate-500 leading-relaxed">
        Si experimentas problemas de arranque, descalibración o falla mecánica en terreno, nuestro equipo técnico de guardia te asiste de forma prioritaria.
      </p>
    </div>

    <div class="space-y-3">
      <a href="tel:+576017458900" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-all group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            ${renderIcon('PhoneCall', 'w-5 h-5')}
          </div>
          <div>
            <div class="text-xs font-bold text-slate-900">Línea Directa de Guardia (24/7)</div>
            <div class="text-xs text-slate-500 font-mono">+57 (601) 745-8900</div>
          </div>
        </div>
        <span class="text-xs font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform">Llamar &rarr;</span>
      </a>

      <a href="https://wa.me/573176543210?text=Hola%20ToolRent,%20requiero%20asistencia%20t%C3%A9cnica%20en%20obra" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-all group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            ${renderIcon('MessageSquare', 'w-5 h-5')}
          </div>
          <div>
            <div class="text-xs font-bold text-slate-900">WhatsApp Técnico de Urgencias</div>
            <div class="text-xs text-slate-500 font-mono">+57 317 654 3210</div>
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">Chatear &rarr;</span>
      </a>
    </div>

    <div class="p-3.5 rounded-xl bg-orange-50 border border-orange-200/80 text-[11px] text-orange-800 leading-relaxed flex items-start gap-2.5">
      ${renderIcon('ShieldCheck', 'w-4 h-4 text-[#FF5A1F] flex-shrink-0 mt-0.5')}
      <span><strong>Garantía de Continuidad de Obra:</strong> Si el equipo no puede calibrarse in situ, ToolRent envía una unidad de sustitución en menos de 4 horas hábiles.</span>
    </div>

    <div class="pt-1 flex justify-end">
      <button id="btn-close-support-modal" type="button" class="px-5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer">
        Cerrar
      </button>
    </div>
  `;
  supportContent.querySelector('#btn-close-support-modal')?.addEventListener('click', () => modal.close());
  modal.open({
    title: '',
    content: supportContent,
    maxWidth: 'max-w-lg',
    hideHeader: true
  });
}
