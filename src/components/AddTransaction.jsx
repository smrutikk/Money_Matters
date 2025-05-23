import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const AddTransaction = ({ showAddModal, setShowAddModal, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    transaction_name: '',
    type: 'debit',
    category: 'shopping',
    amount: '',
    date: new Date().toISOString().split('T')[0] // Default to today's date
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTransaction = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    // Validate amount is positive number
    if (isNaN(formData.amount) || formData.amount === '') {
      throw new Error('Amount must be a number');
    }
    if (Number(formData.amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate transaction name
    if (!formData.transaction_name.trim()) {
      throw new Error('Transaction name is required');
    }

    const payload = {
      name: formData.transaction_name, // Some APIs expect 'name' instead of 'transaction_name'
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      date: formData.date,
      user_id: 1
    };

    const response = await fetch('https://bursting-gelding-24.hasura.app/api/rest/add-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': 'g08A3qQy00y8yFDq3y6N1ZQnhOPOa4msdie5EtKS1hFStar01JzPKrtKEzYY2BtF',
        'x-hasura-role': 'user',
        'x-hasura-user-id': '1',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error response:', errorData); // Log the full error response
      throw new Error(errorData.message || errorData.error || 'Failed to add transaction');
    }

    const result = await response.json();
    console.log('Success:', result); // Log success response
    
    // Reset form and close modal
    setFormData({
      transaction_name: '',
      type: 'debit',
      category: 'shopping',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    
    setShowAddModal(false);
    
    if (onTransactionAdded) {
      onTransactionAdded();
    }

  } catch (err) {
    console.error('Error adding transaction:', err);
    setError(err.message || 'An unexpected error occurred');
  } finally {
    setIsSubmitting(false);
  }
};

  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div 
        className="bg-white rounded-2xl p-8 w-full max-w-md relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <button
          onClick={() => setShowAddModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isSubmitting}
        >
          <FaTimes className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Add Transaction</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAddTransaction} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Transaction Name
              </label>
              <input
                type="text"
                name="transaction_name"
                required
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter Name"
                value={formData.transaction_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Transaction Type
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Category
              </label>
              <select
                name="category"
                required
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="shopping">Shopping</option>
                <option value="services">Services</option>
                <option value="transfers">Transfers</option>
                <option value="entertainment">Entertainment</option>
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full pl-8 px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} // Don't allow future dates
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors flex justify-center items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Add Transaction'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTransaction;