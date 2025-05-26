import React, { useState, useEffect } from 'react';

const UpdateTransaction = ({
  showUpdateModal,
  setShowUpdateModal,
  transaction,
  onTransactionUpdated
}) => {
  const [formData, setFormData] = useState({
    id: '', // Will be set from transaction prop
    name: '',
    type: 'credit',
    category: 'Uncategorized',
    amount: '',
    date: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Shopping',
    'Services',
    'Transfers',
    'Entertainment',
    'Food',
    'Transportation',
    'Uncategorized'
  ];

  useEffect(() => {
    if (transaction) {
      // Ensure category from transaction matches one of the option values (lowercase)
      const initialCategory = transaction.category ?
                              categories.find(c => c.toLowerCase() === transaction.category.toLowerCase()) ?
                                transaction.category.toLowerCase() : 'uncategorized'
                              : 'uncategorized';

      setFormData({
        id: transaction.id, // Store the ID
        name: transaction.name || '',
        type: transaction.type || (transaction.amount >= 0 ? 'credit' : 'debit'), // Use amount sign if type isn't directly available
        category: initialCategory,
        amount: transaction.amount !== undefined ? String(Math.abs(transaction.amount)) : '',
        date: transaction.originalDate ? formatDateForInput(transaction.originalDate) :
              (transaction.date && !transaction.date.includes(',')) ? formatDateForInput(transaction.date) : // if it's already ISO-like
              formatDateForInput(new Date().toISOString()), // Fallback to current date if parsing fails
      });
    }
  }, [transaction]); // Removed categories from dependency array as it's static

  const formatDateForInput = (dateStringOrDate) => {
    try {
      // Handles both ISO strings and Date objects, and potentially pre-formatted 'dd Mon, hh.mm AM/PM'
      let d;
      if (dateStringOrDate instanceof Date) {
        d = dateStringOrDate;
      } else if (typeof dateStringOrDate === 'string' && dateStringOrDate.includes(',')) {
        // Attempt to parse "DD Mon, HH.MM AM/PM" format if needed,
        // but ideally originalDate is already an ISO string.
        // For simplicity, if originalDate is not ISO, we might need a more robust parser.
        // Assuming originalDate is an ISO string or easily convertible.
        d = new Date(dateStringOrDate); // This might fail for "DD Mon, HH.MM AM/PM"
      } else {
         d = new Date(dateStringOrDate); // Assumes ISO string
      }

      if (isNaN(d.getTime())) {
        // If parsing fails, try a fallback or return empty
        console.warn("Failed to parse date for input:", dateStringOrDate);
        return new Date().toISOString().split('T')[0]; // Fallback to today
      }
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error formatting date for input:", dateStringOrDate, e);
      return new Date().toISOString().split('T')[0]; // Fallback to today on any error
    }
  };

  const toISOSafe = (dateString) => { // Input dateString is 'YYYY-MM-DD' from <input type="date">
    try {
      // The input type="date" provides 'YYYY-MM-DD'.
      // To convert to full ISO with time, we can append T00:00:00.000Z for UTC
      // or let the Date constructor parse it based on local timezone if time part is not critical
      // or if the backend handles 'YYYY-MM-DD' directly.
      // For consistency with Hasura, full ISO timestamp is usually preferred.
      const d = new Date(dateString); // This will parse 'YYYY-MM-DD' as local midnight
      if (isNaN(d.getTime())) return new Date().toISOString();
      return d.toISOString(); // Returns 'YYYY-MM-DDT00:00:00.000Z' (or similar, depending on timezone handling)
    } catch {
      return new Date().toISOString();
    }
  };

  // In UpdateTransaction.jsx

const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!transaction || !transaction.id) {
        setError("Transaction ID is missing. Cannot update.");
        setIsLoading(false);
        return;
    }
    
    try {
      if (!formData.date) {
        setError('Please select a valid date');
        setIsLoading(false);
        return;
      }

      // This URL seems correct now based on the 405 error (endpoint exists)
      const apiUrl = `https://bursting-gelding-24.hasura.app/api/rest/update-transaction`;

       const payload = {
        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
        //   THIS OBJECT DEFINITION IS CRITICAL.
        //   THE ERROR "Unexpected variable transaction_name" MEANS
        //   YOUR CODE IS STILL SENDING 'transaction_name' INSTEAD OF 'name'.
        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

        id: transaction.id,         // Also, verify if your API expects 'id' or 'transaction_id'

        // --- THE PROBLEMATIC LINE IS LIKELY HERE ---
        // It should be:
        name: formData.name,
        // NOT:
        // transaction_name: formData.name, // <<< IF YOU HAVE THIS, IT'S WRONG! DELETE/CHANGE IT.

        // --- END OF PROBLEMATIC LINE CHECK ---

        type: formData.type,
        category: formData.category,
        amount: Number(formData.amount), // Also verify how API expects 'amount'
        date: toISOSafe(formData.date)   // Also, verify if API expects 'date' or 'transaction_date'

        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
      };

      // For absolute certainty, add this log right before sending:
      console.log('ACTUAL KEYS IN PAYLOAD BEING SENT:', Object.keys(payload));
      console.log(`Attempting to POST to ${apiUrl} with stringified payload:`, JSON.stringify(payload));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': 'g08A3qQy00y8yFDq3y6N1ZQnhOPOa4msdie5EtKS1hFStar01JzPKrtKEzYY2BtF',
          'x-hasura-role': 'user',
          'x-hasura-user-id': '1',
        },
        body: JSON.stringify(payload) // This sends the payload object as JSON
      });
      
      // Example: If API expects amount to be always positive, and type indicates sign:
      // payload.amount = Math.abs(Number(formData.amount));
      
      // Example: If API expects amount to be signed based on type (frontend calculates sign):
      // payload.amount = formData.type === 'debit' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount));


      console.log(`Attempting to POST to ${apiUrl} with payload:`, JSON.stringify(payload));

      

      if (!response.ok) {
        let errorData;
        const responseText = await response.text(); // Get text first for better debugging
        try {
            errorData = JSON.parse(responseText);
        } catch (e) {
            // If JSON parsing fails, use the raw text.
            errorData = { message: responseText || `HTTP error! status: ${response.status}` };
        }
        console.error('Update API error response:', errorData); 
        const message = errorData?.errors?.[0]?.message || errorData?.message || `Update failed (Status: ${response.status})`;
        throw new Error(message);
      }
      
      // If response is OK, but you want to check the actual data returned by Hasura:
      // const responseData = await response.json();
      // console.log("Update API success response data:", responseData);
      // Add checks here based on responseData if needed, e.g.,
      // if (!responseData.data || !responseData.data.update_transactions_by_pk) {
      //   throw new Error("Update seemed to succeed but no data returned or record not found.");
      // }


      onTransactionUpdated(); 
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Update submission error:', error);
      setError(error.message || 'Failed to update transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showUpdateModal) {
    return null;
  }

  return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Update Transaction</h2>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="tx-name" className="block text-sm font-medium mb-1">Transaction Name</label>
              <input
                id="tx-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="tx-type" className="block text-sm font-medium mb-1">Transaction Type</label>
              <select
                id="tx-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="tx-category" className="block text-sm font-medium mb-1">Category</label>
              <select
                id="tx-category"
                value={formData.category} // Should be lowercase
                onChange={(e) => setFormData({ ...formData, category: e.target.value.toLowerCase() })}
                className="w-full p-2 border rounded-md"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category.toLowerCase()}>
                    {category} {/* Display Title Case */}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="tx-amount" className="block text-sm font-medium mb-1">Amount</label>
              <input
                id="tx-amount"
                type="number"
                min="0" // Amount input should be positive, type handles credit/debit
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="tx-date" className="block text-sm font-medium mb-1">Date</label>
              <input
                id="tx-date"
                type="date" // Provides YYYY-MM-DD
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setError(null); setShowUpdateModal(false); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default UpdateTransaction;