import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AddTransaction from '../components/AddTransaction';
import UpdateTransaction from '../components/UpdateTransaction';

// --- SVG Icon Components (ASSUMED TO BE CORRECT AND UNCHANGED) ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);
const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);
// --- End SVG Icon Components ---

const formatDateFromAPI = (isoDateString) => {
  if (!isoDateString) return "N/A";
  try {
    const dateObj = new Date(isoDateString);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${day} ${month}, ${hours}.${minutesStr} ${ampm}`;
  } catch (e) {
    return isoDateString;
  }
};

const TransactionsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [apiTransactionsData, setApiTransactionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [limit, setLimit] = useState(100); 
  const [offset, setOffset] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowUpdateModal(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    const transaction = transactionToDelete;
    const transactionId = String(transaction.id);
    setShowDeleteConfirm(false);
    
    if (!transaction.isPersisted) {
      setError("This transaction cannot be deleted as it doesn't have a valid server ID.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `https://bursting-gelding-24.hasura.app/api/rest/delete-transaction`;
      
      console.log(`Attempting to DELETE transaction. URL: ${apiUrl}, Body: ${JSON.stringify({ id: transactionId })}`);

      const response = await fetch(
        apiUrl,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'g08A3qQy00y8yFDq3y6N1ZQnhOPOa4msdie5EtKS1hFStar01JzPKrtKEzYY2BtF',
            'x-hasura-role': 'user',
            'x-hasura-user-id': '1',
          },
          body: JSON.stringify({ id: transactionId }),
        }
      );

      if (!response.ok) {
        let errorPayload = { message: `Failed to delete. Status: ${response.status} ${response.statusText}` };
        try {
          const responseBodyText = await response.text();
          if (responseBodyText) {
            try {
              const jsonData = JSON.parse(responseBodyText);
              if (jsonData.message) errorPayload.message = jsonData.message;
              else if (jsonData.error) errorPayload.message = jsonData.error;
              else if (Array.isArray(jsonData.errors) && jsonData.errors.length > 0 && jsonData.errors[0].message) errorPayload.message = jsonData.errors[0].message;
              else if (jsonData.data && jsonData.data.delete_transactions_by_pk === null && jsonData.errors) {
                  errorPayload.message = jsonData.errors[0]?.message || "Failed to delete, record might not exist or permissions issue.";
              } else if (jsonData.data && Object.values(jsonData.data)[0] === null && jsonData.errors) {
                  errorPayload.message = jsonData.errors[0]?.message || "Operation failed, record might not exist or permissions issue.";
              }
              else if (Object.keys(jsonData).length > 0) errorPayload.details = jsonData;
              else errorPayload.message = responseBodyText;
            } catch (jsonError) {
              errorPayload.message = responseBodyText;
            }
          }
        } catch (bodyError) {
          console.error("Failed to read error response body:", bodyError);
        }
        
        let errorMessage = `Failed to delete transaction. Status: ${response.status}`;
        if (errorPayload.message && errorPayload.message !== `Failed to delete. Status: ${response.status} ${response.statusText}`) {
          errorMessage += `. Message: ${errorPayload.message}`;
        }
        if (errorPayload.details) errorMessage += `. Details: ${JSON.stringify(errorPayload.details)}`;
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.responseBody = errorPayload;
        throw error;
      }

      console.log(`Transaction ${transactionId} delete request successful. Status: ${response.status}`);
      
      // Optimistic update
      setApiTransactionsData(prevData => prevData.filter(tx => String(tx.id) !== transactionId));
      
    } catch (error) {
      console.error('Delete error object:', error);
      console.error('Delete error message:', error.message);
      if (error.responseBody) {
          console.error('Delete error response body details:', error.responseBody);
      }
      setError(error.message || 'An unexpected error occurred during deletion.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = `https://bursting-gelding-24.hasura.app/api/rest/all-transactions?limit=${limit}&offset=${offset}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'g08A3qQy00y8yFDq3y6N1ZQnhOPOa4msdie5EtKS1hFStar01JzPKrtKEzYY2BtF',
            'x-hasura-role': 'user',
            'x-hasura-user-id': '1', 
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching from URL: ${apiUrl}`);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Raw API response:', result);
        
        let rawData;
        if (Array.isArray(result)) {
          rawData = result;
        } else if (result?.transactions) {
          rawData = result.transactions;
        } else if (result?.all_transactions) {
          rawData = result.all_transactions;
        } else {
          const keys = Object.keys(result);
          const arrayKey = keys.find(key => Array.isArray(result[key]));
          if (arrayKey) {
            rawData = result[arrayKey];
          } else {
            console.error('Unrecognized API response structure:', result);
            throw new Error('API response does not contain a recognizable transaction array');
          }
        }

        if (!rawData || !Array.isArray(rawData)) {
          console.error('Processed data is not an array:', rawData);
          throw new Error('Processed data is not an array of transactions');
        }
        
        let transformedData = rawData.map(tx => {
          const originalDateStr = tx.date || tx.transaction_date;
          const amountValue = Number(tx.amount) || 0;
          const backendId = tx.id || tx.transaction_id;
          return {
            id: backendId || Math.random().toString(36).substr(2, 9),
            isPersisted: !!backendId,
            name: tx.transaction_name || tx.name || 'Unknown Transaction',
            category: tx.category || 'Uncategorized',
            date: formatDateFromAPI(originalDateStr),
            originalDate: originalDateStr,
            amount: tx.type === 'credit' ? Math.abs(amountValue) : -Math.abs(amountValue),
            direction: tx.type === 'credit' ? 'up' : 'down',
          };
        });
        
        transformedData.sort((a, b) => {
          const dateA = a.originalDate ? new Date(a.originalDate) : null;
          const dateB = b.originalDate ? new Date(b.originalDate) : null;
          const isValidDateA = dateA && !isNaN(dateA.getTime());
          const isValidDateB = dateB && !isNaN(dateB.getTime());
          if (isValidDateA && !isValidDateB) return -1;
          if (!isValidDateA && isValidDateB) return 1;
          if (!isValidDateA && !isValidDateB) return 0;
          return dateB.getTime() - dateA.getTime();
        });
        
        setApiTransactionsData(transformedData);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [limit, offset]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'debit') {
      return apiTransactionsData.filter(t => t.amount < 0);
    }
    if (activeTab === 'credit') {
      return apiTransactionsData.filter(t => t.amount >= 0);
    }
    return apiTransactionsData;
  }, [activeTab, apiTransactionsData]);

  const getTabClassName = (tabName) => {
    const baseClass = "px-3 py-2 text-sm font-medium focus:outline-none";
    if (activeTab === tabName) {
      return `${baseClass} text-blue-600 border-b-2 border-blue-600`;
    }
    return `${baseClass} text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300`;
  };

  if (isLoading && apiTransactionsData.length === 0) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 flex justify-center items-center bg-gray-50 min-h-screen">
          <p className="text-lg text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error && apiTransactionsData.length === 0) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-7">
            <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-3">Failed to Load Transactions</h2>
            <p className="text-gray-700 mb-1">Error: {error}</p>
            <button 
              onClick={() => {
                setOffset(prev => prev);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-7">
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            <PlusIcon />
            Add Transaction
          </button>
          <AddTransaction 
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            onTransactionAdded={() => {
              setShowAddModal(false);
              setOffset(prev => prev + 1); 
              setTimeout(() => setOffset(prev => prev - 1), 100);
            }}
          />
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
            <p><strong>Error:</strong> {error}</p>
            <button onClick={() => setError(null)} className="text-sm text-red-600 hover:text-red-800 font-semibold">Dismiss</button>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-80">
              <h3 className="text-lg font-semibold mb-4">Delete Transaction?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{transactionToDelete?.name}"?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteTransaction}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={getTabClassName('all')}
              onClick={() => setActiveTab('all')}
            >
              All Transactions
            </button>
            <button
              className={getTabClassName('debit')}
              onClick={() => setActiveTab('debit')}
            >
              Debit
            </button>
            <button
              className={getTabClassName('credit')}
              onClick={() => setActiveTab('credit')}
            >
              Credit
            </button>
          </div>
        </div>
        
        <UpdateTransaction
          showUpdateModal={showUpdateModal}
          setShowUpdateModal={setShowUpdateModal}
          transaction={selectedTransaction}
          onTransactionUpdated={() => {
            setShowUpdateModal(false);
            setOffset(prev => prev + 1);
            setTimeout(() => setOffset(prev => prev - 1), 100);
          }}
        />

        <div className="bg-white rounded-xl shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Transaction Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 mr-3`}>
                          {transaction.direction === 'up' ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </div>
                        <div className="text-sm font-medium text-gray-800">{transaction.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.amount >= 0 ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          className="text-blue-400 hover:text-blue-600 focus:outline-none"
                          onClick={() => handleEditTransaction(transaction)}
                          disabled={!transaction.isPersisted}
                          title={!transaction.isPersisted ? "Cannot edit an unsaved transaction" : "Edit transaction"}
                        >
                          <PencilIcon />
                       </button>
                        
                        <button 
                          className="text-red-400 hover:text-red-600 focus:outline-none"
                          onClick={() => {
                            setTransactionToDelete(transaction);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={!transaction.isPersisted}
                          title={!transaction.isPersisted ? "Cannot delete an unsaved transaction" : "Delete transaction"}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && !isLoading && ( 
              <div className="text-center py-10 text-gray-500">
                No transactions found for the current filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;