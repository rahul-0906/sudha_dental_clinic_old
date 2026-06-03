import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isStaffAvailable: localStorage.getItem('isStaffAvailable') === 'true',
  isAuthenticated: false,
  activeView: localStorage.getItem('activeView') || 'dashboard',
  lowStockCount: 0,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setStaffMode: (state, action) => {
      state.isStaffAvailable = action.payload
      localStorage.setItem('isStaffAvailable', action.payload)
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload
      localStorage.setItem('activeView', action.payload)
    },
    setLowStockCount: (state, action) => {
      state.lowStockCount = action.payload
    },
  },
})

export const { setStaffMode, setAuthenticated, setActiveView, setLowStockCount } = appSlice.actions
export default appSlice.reducer
