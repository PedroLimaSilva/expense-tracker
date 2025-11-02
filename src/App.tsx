import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { CategoryProvider } from './contexts/CategoryContext'
import { DataProvider } from './contexts/DataContext'
import { PrivateRoute } from './pages/PrivateRoute'
import { AuthenticatedLayout } from './components/AuthenticatedLayout'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Overview } from './pages/Overview'
import { IncomePage } from './pages/Income'
import { ExpensesPage } from './pages/Expenses'
import { CategoriesPage } from './pages/Categories'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <CategoryProvider>
            <DataProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <AuthenticatedLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Navigate to="/overview" replace />} />
                    <Route path="overview" element={<Overview />} />
                    <Route path="income" element={<IncomePage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                  </Route>
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <AuthenticatedLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Settings />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/overview" />} />
                </Routes>
              </BrowserRouter>
            </DataProvider>
          </CategoryProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App