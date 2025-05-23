import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AddTransaction from '../components/AddTransaction';

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
    // Check if dateObj is valid
    if (isNaN(dateObj.getTime())) {
        // console.warn("Invalid date string received for formatting:", isoDateString);
        return "Invalid Date";
    }
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
    console.error("Error formatting date:", isoDateString, e);
    return isoDateString; // Return original if error
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
        
        // MODIFICATION: Transform and keep original date for sorting
        let transformedData = rawData.map(tx => {
          const originalDateStr = tx.date || tx.transaction_date; // Get the raw date string
          return {
            id: tx.id || tx.transaction_id || Math.random().toString(36).substr(2, 9),
            name: tx.transaction_name || tx.name || 'Unknown Transaction',
            category: tx.category || 'Uncategorized',
            date: formatDateFromAPI(originalDateStr), // Formatted date for display
            originalDate: originalDateStr, // Keep original date string for sorting
            amount: Number(tx.amount) || 0,
            direction: tx.type === 'credit' ? 'up' : (tx.type === 'debit' ? 'down' : ((Number(tx.amount) || 0) >= 0 ? 'up' : 'down')),
          };
        });
        
        // MODIFICATION: Sort transactions by originalDate in descending order (most recent first)
        transformedData.sort((a, b) => {
          const dateA = a.originalDate ? new Date(a.originalDate) : null;
          const dateB = b.originalDate ? new Date(b.originalDate) : null;

          // Check if dates are valid. Invalid dates (or null) should be sorted predictably.
          // We want valid dates to appear before invalid/missing dates.
          const isValidDateA = dateA && !isNaN(dateA.getTime());
          const isValidDateB = dateB && !isNaN(dateB.getTime());

          if (isValidDateA && !isValidDateB) return -1; // a is valid, b is not -> a comes first (newer)
          if (!isValidDateA && isValidDateB) return 1;  // b is valid, a is not -> b comes first (newer)
          if (!isValidDateA && !isValidDateB) return 0; // both invalid/missing -> keep relative order

          // Both dates are valid, sort descending (b - a for newest first)
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
  }, [limit, offset]); // Added limit and offset as dependencies if you want re-fetch on change

  const filteredTransactions = useMemo(() => {
    // The apiTransactionsData is already sorted, filtering will preserve this order.
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

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 flex justify-center items-center bg-gray-50 min-h-screen">
          <p className="text-lg text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
                // Simple retry by re-triggering the fetch.
                // If limit/offset haven't changed, you might need a dedicated retry state
                // or ensure fetchTransactions is callable and memoized appropriately.
                // For this setup, changing offset slightly and back could trigger it,
                // or simply make fetchTransactions callable.
                // For simplicity, window.location.reload() is a hard retry.
                // A better way if limit/offset are deps:
                setOffset(prevOffset => prevOffset); // This would trigger effect if it's a dependency
                // Or, if fetchTransactions was memoized with useCallback:
                // fetchTransactions();
                window.location.reload(); 
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
        // You would typically fetch transactions again here
        // fetchTransactions();
      }}
    />
        </div>
        
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
                      {transaction.date} {/* This is the formatted date for display */}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.amount >= 0 ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button className="text-blue-400 hover:text-blue-600 focus:outline-none">
                          <PencilIcon />
                        </button>
                        <button className="text-red-400 hover:text-red-600 focus:outline-none">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && !isLoading && !error && (
              <div className="text-center py-10 text-gray-500">
                No transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;