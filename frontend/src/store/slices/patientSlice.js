import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  searchPatients as apiSearch,
  registerPatient as apiRegister,
} from '../../api/patients'
import toast from 'react-hot-toast'

export const searchPatients = createAsyncThunk(
  'patient/searchPatients',
  async (query, { rejectWithValue }) => {
    try {
      const res = await apiSearch(query)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed')
    }
  }
)

export const registerPatient = createAsyncThunk(
  'patient/registerPatient',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiRegister(data)
      toast.success('🦷 Patient registered!')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
    }
  }
)

const patientSlice = createSlice({
  name: 'patient',
  initialState: {
    selectedPatient: null,
    searchResults: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedPatient: (state, action) => {
      state.selectedPatient = action.payload
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null
      state.searchResults = []
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // searchPatients
      .addCase(searchPatients.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.loading = false
        state.searchResults = action.payload
      })
      .addCase(searchPatients.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // registerPatient
      .addCase(registerPatient.pending, (state) => {
        state.loading = true
      })
      .addCase(registerPatient.fulfilled, (state, action) => {
        state.loading = false
        state.selectedPatient = action.payload
      })
      .addCase(registerPatient.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Registration failed')
      })
  },
})

export const { setSelectedPatient, clearSelectedPatient, clearSearchResults, clearError } = patientSlice.actions
export default patientSlice.reducer
