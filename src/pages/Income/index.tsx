import { useState } from 'react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { IncomeList } from '../../components/Income/list'
import { IncomeForm } from '../../components/Income/form'
import { type Income, type IncomeFormData } from '../../types/income'
import { incomeService } from '../../services/incomeService'
import { useTimeWindow } from '../../contexts/TimeWindowContext'
import { filterByTimeWindow, formatTimeWindowHeading } from '../../utils/dateFilter'
import './index.scss'

export function IncomePage() {
  const { income, loadData } = useData()
  const { currentUser } = useAuth()
  const { timeWindow } = useTimeWindow()
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  const filteredIncome = filterByTimeWindow(income, timeWindow)

  // Get localized heading
  const displayLocale = navigator.language || 'en-US'
  const timeWindowHeading = formatTimeWindowHeading(timeWindow, displayLocale)

  async function handleAddIncome(data: IncomeFormData) {
    if (!currentUser) return

    try {
      await incomeService.createIncome(currentUser.uid, data)
      await loadData()
      setShowForm(false)
    } catch (error) {
      console.error('Error adding income:', error)
      throw error
    }
  }

  async function handleUpdateIncome(data: IncomeFormData) {
    if (!editingIncome) return

    try {
      const updatedIncome: Income = {
        ...editingIncome,
        ...data
      }
      await incomeService.updateIncome(updatedIncome)
      await loadData()
      setEditingIncome(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating income:', error)
      throw error
    }
  }

  async function handleDeleteIncome(incomeId: string) {
    try {
      await incomeService.deleteIncome(incomeId)
      await loadData()
    } catch (error) {
      console.error('Error deleting income:', error)
    }
  }

  function handleEditIncome(income: Income) {
    setEditingIncome(income)
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingIncome(null)
  }

  if (showForm) {
    return (
      <IncomeForm
        income={editingIncome}
        onSubmit={editingIncome ? handleUpdateIncome : handleAddIncome}
        onCancel={handleCancelForm}
      />
    )
  }

  return (
    <div className="income-page">
      <h2 className="time-window-heading-top">{timeWindowHeading}</h2>
      
      <div className="dashboard-actions">
        <button
          onClick={() => {
            setEditingIncome(null)
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          <span className="material-icons">add</span>
          Add Income
        </button>
      </div>
      <IncomeList
        income={filteredIncome}
        onEdit={handleEditIncome}
        onDelete={handleDeleteIncome}
      />
    </div>
  )
}
