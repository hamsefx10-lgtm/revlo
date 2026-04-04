import React from 'react';
import { TrendingUp, TrendingDown, Clock, Scale, Plus, Repeat, ArrowRight, ReceiptText, Banknote } from 'lucide-react';
import Link from 'next/link';

export function MobileAccountingView({ overviewStats, activeTab, setActiveTab, recentTransactions, accounts, companyDebts, payableDebts }: any) {
  return (
    <div className="block md:hidden pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 pt-4 px-4">
        <div>
          <h1 className="text-3xl font-black text-darkGray dark:text-white">Finance</h1>
          <p className="text-mediumGray text-xs font-bold uppercase tracking-widest mt-1">Xisaabaadka Shirkadda</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/projects/accounting/transactions/transfer" className="p-3 bg-white dark:bg-gray-800 rounded-full text-darkGray dark:text-white shadow-sm border border-gray-100 dark:border-gray-700">
            <Repeat size={18} />
          </Link>
          <Link href="/projects/accounting/transactions/add" className="p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/30">
            <Plus size={18} />
          </Link>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/30 blur-3xl rounded-full" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Wadarta Lacagta (Balance)</p>
          <h2 className="text-4xl font-black mb-6">{overviewStats?.totalBalance?.toLocaleString() || 0} <span className="text-xl text-gray-500">ETB</span></h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center text-green-400 mb-1">
                <TrendingUp size={14} className="mr-1" /> <span className="text-[10px] font-bold uppercase tracking-wider">Income</span>
              </div>
              <p className="font-black text-lg">+{overviewStats?.totalIncome?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center text-red-400 mb-1">
                <TrendingDown size={14} className="mr-1" /> <span className="text-[10px] font-bold uppercase tracking-wider">Expense</span>
              </div>
              <p className="font-black text-lg">-{overviewStats?.totalExpenses?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="px-4 mb-6 overflow-x-auto custom-scrollbar flex space-x-2 pb-2">
        {['Overview', 'Transactions', 'Receivables', 'Payables', 'Accounts'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === t ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-gray-800 text-mediumGray dark:text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="px-4 space-y-4">
          {/* Receivables & Payables */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveTab('Receivables')} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left transition-all active:scale-95">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <Scale size={14} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-[10px] font-bold text-mediumGray uppercase tracking-widest mb-1">Receivables</p>
              <p className="text-xl font-black text-darkGray dark:text-white">{overviewStats?.totalReceivables?.toLocaleString() || 0}</p>
            </button>
            <button onClick={() => setActiveTab('Payables')} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left transition-all active:scale-95">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                <Clock size={14} className="text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-[10px] font-bold text-mediumGray uppercase tracking-widest mb-1">Payables</p>
              <p className="text-xl font-black text-darkGray dark:text-white">{overviewStats?.totalPayables?.toLocaleString() || 0}</p>
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
            <h3 className="font-black text-darkGray dark:text-white mb-4">Accounts Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl">
                 <span className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center"><Banknote size={14} className="mr-2" /> Bank</span>
                 <span className="font-black">{overviewStats?.totalBankAccounts || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl">
                 <span className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center"><Banknote size={14} className="mr-2" /> Cash</span>
                 <span className="font-black">{overviewStats?.totalCashAccounts || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl">
                 <span className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center"><Banknote size={14} className="mr-2" /> Mobile Money</span>
                 <span className="font-black">{overviewStats?.totalMobileMoneyAccounts || 0}</span>
              </div>
            </div>
            <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Accounts'); }} className="mt-4 flex items-center justify-center w-full py-3 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold text-primary shadow-sm">
              View All <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'Transactions' && (
        <div className="px-4 space-y-4">
          <h3 className="font-black text-xl text-darkGray dark:text-white mb-4 flex items-center"><ReceiptText size={20} className="mr-2 text-primary" /> Recent Activity</h3>
          {recentTransactions?.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-2xl">
              <p className="text-mediumGray font-bold">No transactions found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions?.map((trx: any) => (
                <div key={trx.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${trx.type === 'INCOME' ? 'bg-green-100 text-green-600' : trx.type === 'EXPENSE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {trx.type === 'INCOME' ? <TrendingUp size={16} /> : trx.type === 'EXPENSE' ? <TrendingDown size={16} /> : <Repeat size={16} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-darkGray dark:text-white text-sm max-w-[150px] truncate">{trx.description}</h4>
                      <p className="text-xs text-mediumGray">{new Date(trx.transactionDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${trx.type === 'INCOME' ? 'text-green-500' : trx.type === 'EXPENSE' ? 'text-red-500' : 'text-blue-500'}`}>
                      {trx.type === 'EXPENSE' ? '-' : '+'}{trx.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/projects/accounting/transactions" className="mt-4 flex items-center justify-center w-full py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-darkGray dark:text-white">
            Full History
          </Link>
        </div>
      )}

      {activeTab === 'Receivables' && (
        <div className="px-4 space-y-4">
          <h3 className="font-black text-xl text-darkGray dark:text-white mb-4 flex items-center">Receivables</h3>
          {companyDebts?.filter((d: any) => (d.remaining || 0) > 0).length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-2xl">
              <p className="text-mediumGray font-bold">No pending receivables.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companyDebts?.filter((d: any) => (d.remaining || 0) > 0).map((debt: any) => (
                <div key={debt.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-darkGray dark:text-white">{debt.lender || debt.client}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${debt.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{debt.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-mediumGray font-bold">Total:</span>
                    <span>{debt.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-red-500 font-bold uppercase text-[10px] tracking-wider">Remaining</span>
                    <span className="font-black text-lg text-darkGray dark:text-white">{debt.remaining?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Payables' && (
        <div className="px-4 space-y-4">
          <h3 className="font-black text-xl text-darkGray dark:text-white mb-4 flex items-center">Payables</h3>
          {payableDebts?.filter((d: any) => (d.remaining || 0) > 0).length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-2xl">
              <p className="text-mediumGray font-bold">No pending payables.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payableDebts?.filter((d: any) => (d.remaining || 0) > 0).map((debt: any) => (
                <div key={debt.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-darkGray dark:text-white">{debt.lender || debt.client}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${debt.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{debt.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-mediumGray font-bold">Total:</span>
                    <span>{debt.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-orange-500 font-bold uppercase text-[10px] tracking-wider">Remaining</span>
                    <span className="font-black text-lg text-darkGray dark:text-white">{debt.remaining?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Accounts' && (
        <div className="px-4 space-y-4">
          <h3 className="font-black text-xl text-darkGray dark:text-white mb-4">Accounts Directory</h3>
          {accounts?.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-2xl">
              <p className="text-mediumGray font-bold">No accounts found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts?.map((acc: any) => (
                <div key={acc.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Banknote size={16} className="text-primary" />
                      <h4 className="font-black text-darkGray dark:text-white">{acc.name}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded text-mediumGray uppercase">{acc.type}</span>
                  </div>
                  <p className="text-2xl font-black text-darkGray dark:text-white my-2">{acc.currency} {acc.balance.toLocaleString()}</p>
                  <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Link href={`/projects/accounting/accounts/${acc.id}`} className="text-primary text-xs font-bold">
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
