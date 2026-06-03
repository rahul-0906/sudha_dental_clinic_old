import StaffPanel from './StaffPanel'
import DoctorPanel from './DoctorPanel'
import { ClipboardList, Stethoscope } from 'lucide-react'

export default function StaffLayout() {
  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Staff Panel — Left Fixed */}
      <div className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full overflow-y-auto">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <ClipboardList size={16} strokeWidth={1.5} className="text-teal-600" />
          <span className="font-semibold text-slate-800 text-sm">STAFF STATION</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <StaffPanel />
        </div>
      </div>

      {/* Doctor Panel — Right Dynamic */}
      <div className="flex-1 bg-white flex flex-col h-full overflow-y-auto w-full">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <Stethoscope size={16} strokeWidth={1.5} className="text-teal-600" />
          <span className="font-semibold text-slate-800 text-sm">DOCTOR WORKSPACE</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DoctorPanel />
        </div>
      </div>
    </div>
  )
}
