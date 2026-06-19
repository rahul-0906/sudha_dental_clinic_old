import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import patientReducer from './slices/patientSlice'

const store = configureStore({
  reducer: {
    app: appReducer,
    patient: patientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['patient/setSelectedPatient'],
      },
    }),
})

export default store
export { store }
