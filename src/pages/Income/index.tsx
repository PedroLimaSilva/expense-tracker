import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { IncomeList } from '../../components/Income/list'
import { IncomeForm } from '../../components/Income/form'
import { type Income, type IncomeFormData } from '../../types/income'
import { incomeService } from '../../services/incomeService'

export function IncomePage() {
  const { income, loadData } = useData()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

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
        income={income}
        onEdit={handleEditIncome}
        onDelete={handleDeleteIncome}
      />
    </div>
  )
}
