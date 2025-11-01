import { useState, type FormEvent } from 'react'
import { useCategories } from '../contexts/CategoryContext'
import { type Category } from '../types/category'
import './CategoryManager.scss'

type CategoryType = 'expense' | 'income'

export function CategoryManager() {
  const {
    expenseCategories,
    incomeCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loading
  } = useCategories()

  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryType, setCategoryType] = useState<CategoryType>('expense')
  const [categoryName, setCategoryName] = useState('')

  const currentCategories = categoryType === 'expense' ? expenseCategories : incomeCategories

  function handleAddNew() {
    setEditingCategory(null)
    setCategoryName('')
    setShowForm(true)
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setCategoryType(category.type)
    setCategoryName(category.name)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingCategory(null)
    setCategoryName('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!categoryName.trim()) return

    try {
      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: categoryName.trim()
        })
      } else {
        await createCategory({
          name: categoryName.trim(),
          type: categoryType
        })
      }
      handleCancel()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  async function handleDelete(categoryId: string, categoryName: string) {
    if (!window.confirm(`Delete category "${categoryName}"? Expenses/income using this category will still work, but you won't be able to select it for new entries.`)) {
      return
    }

    try {
      await deleteCategory(categoryId)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  if (showForm) {
    return (
      <div className="category-form-container">
        <form onSubmit={handleSubmit} className="category-form">
          <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>

          <div className="form-group">
            <label htmlFor="category-type">Type</label>
            <select
              id="category-type"
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value as CategoryType)}
              disabled={!!editingCategory}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category-name">Name</label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              placeholder="Category name"
              autoFocus
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <h3>Manage Categories</h3>
        <button onClick={handleAddNew} className="btn btn-primary">
          + Add Category
        </button>
      </div>

      <div className="category-tabs">
        <button
          className={`tab ${categoryType === 'expense' ? 'active' : ''}`}
          onClick={() => setCategoryType('expense')}
        >
          Expense Categories
        </button>
        <button
          className={`tab ${categoryType === 'income' ? 'active' : ''}`}
          onClick={() => setCategoryType('income')}
        >
          Income Categories
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading categories...</div>
      ) : (
        <div className="category-list">
          {currentCategories.length === 0 ? (
            <div className="category-empty">
              <p>No {categoryType} categories yet. Add your first category!</p>
            </div>
          ) : (
            currentCategories.map(category => (
              <div key={category.id} className="category-item">
                <span className="category-name">{category.name}</span>
                <div className="category-actions">
                  <button
                    onClick={() => handleEdit(category)}
                    className="btn btn-small btn-secondary"
                    title="Edit category"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="btn btn-small btn-danger"
                    title="Delete category"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
