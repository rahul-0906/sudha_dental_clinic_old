import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Trash2, 
  Clock, 
  Phone, 
  Mail, 
  Edit, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Loader2
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setActiveView } from '../../store/slices/appSlice'
import { getAllStaff, addStaff, updateStaff, deleteStaff } from '../../api/staff'
import toast from 'react-hot-toast'

export default function StaffPage() {
  const dispatch = useDispatch()
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState(null)

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'NURSE',
    status: 'ACTIVE',
    shiftStart: '09:00 AM',
    shiftEnd: '05:00 PM'
  })

  const loadStaff = async () => {
    setLoading(true)
    try {
      const res = await getAllStaff()
      setStaffList(res.data || [])
    } catch (err) {
      toast.error('Failed to load staff list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editMode) {
        await updateStaff(selectedStaffId, form)
        toast.success('Staff member updated successfully!')
      } else {
        await addStaff(form)
        toast.success('Staff member added successfully!')
      }
      setShowAddModal(false)
      setEditMode(false)
      loadStaff()
    } catch (err) {
      toast.error('Failed to save staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (staff) => {
    setForm({
      name: staff.name,
      phone: staff.phone || '',
      email: staff.email || '',
      role: staff.role || 'NURSE',
      status: staff.status || 'ACTIVE',
      shiftStart: staff.shiftStart || '09:00 AM',
      shiftEnd: staff.shiftEnd || '05:00 PM'
    })
    setSelectedStaffId(staff.id)
    setEditMode(true)
    setShowAddModal(true)
  }

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return
    try {
      await deleteStaff(id)
      toast.success('Staff member deleted')
      loadStaff()
    } catch (err) {
      toast.error('Failed to delete staff member')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 select-none">
        <button 
          onClick={() => dispatch(setActiveView('dashboard'))} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-755 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-bold text-slate-800">Staff Management</span>
        </button>

        <button 
          onClick={() => {
            setForm({
              name: '',
              phone: '',
              email: '',
              role: 'NURSE',
              status: 'ACTIVE',
              shiftStart: '09:00 AM',
              shiftEnd: '05:00 PM'
            })
            setEditMode(false)
            setShowAddModal(true)
          }}
          className="flex items-center gap-1 px-3.5 h-9 text-xs rounded-xl bg-teal-650 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Grid Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-150 select-none">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">Shift Details</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-50 last:border-none">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="w-24 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-2 bg-slate-200 rounded" />
                      </div>
                    </td>
                    <td className="p-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="w-20 h-3 bg-slate-200 rounded" />
                        <div className="w-28 h-3 bg-slate-200 rounded" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="w-24 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-2 bg-slate-200 rounded" />
                      </div>
                    </td>
                    <td className="p-4"><div className="w-12 h-4 bg-slate-200 rounded-full" /></td>
                    <td className="p-4 text-center"><div className="w-12 h-6 bg-slate-200 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                    No staff members registered. Use the "Add Staff Member" button above.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/30 transition-colors text-slate-700">
                    <td className="p-4 font-semibold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {staff.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{staff.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">STF-00{staff.id}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {staff.role}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-slate-500">
                        <span className="flex items-center gap-1"><Phone size={12} /> {staff.phone || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Mail size={12} /> {staff.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-500 flex items-center gap-1 mt-3.5">
                      <Clock size={12} className="text-slate-400" />
                      <span>{staff.shiftStart} - {staff.shiftEnd}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        staff.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : staff.status === 'ON_BREAK'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {staff.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(staff)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(staff.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Delete Staff Member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 p-6 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 select-none">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} strokeWidth={1.5} className="text-teal-650" />
                <span>{editMode ? 'Edit Staff Details' : 'Add Staff Member'}</span>
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-slate-404 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 XXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="DENTIST">DENTIST</option>
                    <option value="NURSE">NURSE</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_BREAK">ON_BREAK</option>
                    <option value="OFF_DUTY">OFF_DUTY</option>
                  </select>
                </div>

                {/* Shift Start */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Shift Start *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={form.shiftStart}
                    onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Shift End */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Shift End *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM"
                    value={form.shiftEnd}
                    onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4 select-none">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className={`btn-primary flex-2 flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving && <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />}
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
