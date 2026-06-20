import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, Check, UserPlus, Loader2 } from 'lucide-react'
import { registerPatient } from '../../api/patients'
import { setSelectedPatient } from '../../store/slices/patientSlice'
import toast from 'react-hot-toast'

export default function PatientRegistrationModal({ onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    name: '', phone: '', dob: '', age: '', gender: '', address: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const calculateAge = (dobString) => {
    if (!dobString || dobString.length !== 10) return ''
    const parts = dobString.split('/')
    if (parts.length !== 3) return ''
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    if (isNaN(day) || isNaN(month) || isNaN(year)) return ''
    const birthDate = new Date(year, month, day)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age.toString() : ''
  }

  const calculateDob = (ageString) => {
    if (!ageString) return ''
    const age = parseInt(ageString, 10)
    if (isNaN(age) || age < 0) return ''
    const today = new Date()
    const birthYear = today.getFullYear() - age
    return `01/01/${birthYear}`
  }

  const isValidDate = (dobString) => {
    if (!dobString) return true
    if (dobString.length !== 10) return false
    const parts = dobString.split('/')
    if (parts.length !== 3) return false
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    const dateObj = new Date(year, month - 1, day)
    return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day
  }

  const handleDobChange = (val) => {
    let cleaned = val.replace(/[^0-9/]/g, '')
    
    if (cleaned.length > form.dob.length) {
      if (cleaned.length === 2 && !cleaned.includes('/')) {
        cleaned = cleaned + '/'
      } else if (cleaned.length === 5 && cleaned.split('/').length === 2) {
        cleaned = cleaned + '/'
      }
    }
    
    setForm(prev => {
      const updated = { ...prev, dob: cleaned }
      if (cleaned.length === 10) {
        const ageVal = calculateAge(cleaned)
        if (ageVal) {
          updated.age = ageVal
        }
      }
      return updated
    })
  }

  const handleAgeChange = (val) => {
    const ageVal = val.replace(/\D/g, '')
    setForm(prev => {
      const updated = { ...prev, age: ageVal }
      if (ageVal && !prev.dob) {
        updated.dob = calculateDob(ageVal)
      }
      return updated
    })
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.match(/^\d{10}$/)) e.phone = 'Enter a valid 10-digit phone number'
    if (form.dob && !isValidDate(form.dob)) {
      e.dob = 'Enter a valid date (DD/MM/YYYY)'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      let dobToSend = null
      if (form.dob && form.dob.length === 10) {
        const parts = form.dob.split('/')
        if (parts.length === 3) {
          dobToSend = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }

      const res = await registerPatient({
        name: form.name,
        phone: form.phone,
        dob: dobToSend,
        gender: form.gender || null,
        address: form.address || null
      })
      const patient = res.data
      dispatch(setSelectedPatient(patient))
      toast.success(`${patient.name} registered successfully!`)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (msg.includes('phone') || msg.includes('duplicate')) {
        setErrors({ phone: 'This phone number is already registered' })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 p-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} strokeWidth={1.5} className="text-teal-600" />
            <span>Register New Patient</span>
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Name & Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Full Name *
              </label>
              <input 
                className="input-field w-full" 
                type="text" 
                placeholder="Patient's full name"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Phone Number * (10 digits)
              </label>
              <input 
                className="input-field w-full" 
                type="tel" 
                placeholder="9876543210"
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                maxLength={10} 
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Row 2: DOB & Age, Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date of Birth & Age
              </label>
              <div className="grid grid-cols-[2fr_1fr] gap-3">
                <div>
                  <input 
                    className="input-field w-full" 
                    type="text" 
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    value={form.dob} 
                    onChange={(e) => handleDobChange(e.target.value)} 
                  />
                  {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                </div>
                <div>
                  <input 
                    className="input-field w-full" 
                    type="text" 
                    placeholder="Age"
                    value={form.age} 
                    onChange={(e) => handleAgeChange(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gender
              </label>
              <div className="flex items-center gap-2 w-full h-10">
                {['Male', 'Female', 'Other'].map((option) => (
                  <label key={option} className="flex-1 h-full cursor-pointer relative">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={form.gender === option}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="sr-only"
                    />
                    <div 
                      className={`flex items-center justify-center h-full w-full rounded-lg border text-sm select-none transition-colors ${
                        form.gender === option
                          ? 'border-teal-600 bg-teal-50 text-teal-700 font-medium shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 3: Address */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Address
              </label>
              <textarea 
                className="input-field resize-y min-h-[64px] w-full" 
                placeholder="Patient address..."
                value={form.address} 
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2} 
              />
            </div>
          </div>



          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className={`btn-primary flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={1.5} />
                  <span>Register Patient</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
