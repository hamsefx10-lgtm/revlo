import os
import re

file_path = r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Premium AccountRow
row_replacement = """const AccountRow: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => (
  <tr className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300 border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0 group backdrop-blur-md">
    <td className="p-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl flex-shrink-0 ${account.type === 'BANK' ? 'bg-primary/10 text-primary' : account.type === 'MOBILE_MONEY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
          <Banknote size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors text-lg">{account.name}</h4>
        </div>
      </div>
    </td>
    <td className="p-4 whitespace-nowrap">
      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm">
        {account.type.replace('_', ' ')}
      </span>
    </td>
    <td className="p-4 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <Coins size={14} className="text-gray-400" />
        <span className="font-semibold text-gray-600 dark:text-gray-300">{account.currency}</span>
      </div>
    </td>
    <td className="p-4 whitespace-nowrap text-right font-black text-xl tracking-tight text-emerald-500 dark:text-emerald-400">
      ${account.balance.toLocaleString()}
    </td>
    <td className="p-4 whitespace-nowrap text-right group-hover:opacity-100 transition-opacity">
      <div className="flex items-center justify-end space-x-2">
        <Link href={`/projects/accounting/transactions/transfer?fromAccount=${account.id}`} className="p-2 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5" title="Transfer Money">
          <Repeat size={16} />
        </Link>
        <Link href={`/projects/accounting/accounts/${account.id}`} className="p-2 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-white text-gray-600 hover:text-primary dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 transition-all shadow-sm border border-transparent dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5" title="View Details">
          <Eye size={16} />
        </Link>
        <button onClick={() => onEdit(account.id)} className="p-2 rounded-xl bg-gray-100 hover:bg-white text-gray-600 hover:text-primary dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 transition-all shadow-sm border border-transparent dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5" title="Wax ka bedel">
          <Edit size={16} />
        </button>
        <button onClick={() => onDelete(account.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5" title="Tirtir">
          <Trash2 size={16} />
        </button>
      </div>
    </td>
  </tr>
);"""

content = re.sub(r'const AccountRow: React\.FC<.*?> = \(\{.*?\}\) => \(\s*<tr.*?</tr>\s*\);\n', row_replacement + "\n", content, flags=re.DOTALL)

# 2. Premium AccountCard
card_replacement = """const AccountCard: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => {
  let borderColor = 'from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800';
  let iconColorClass = 'text-gray-500 bg-gray-500/10';

  if (account.type === 'BANK') {
    borderColor = 'from-primary to-blue-400';
    iconColorClass = 'text-primary bg-primary/10';
  } else if (account.type === 'MOBILE_MONEY') {
    borderColor = 'from-emerald-400 to-emerald-600';
    iconColorClass = 'text-emerald-500 bg-emerald-500/10';
  }

  return (
    <div className="relative group p-[1px] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 animate-fade-in-up hover:-translate-y-1">
      {/* Animated gradient border wrapper */}
      <div className={`absolute inset-0 bg-gradient-to-br ${borderColor} opacity-40 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-[2rem] h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${iconColorClass}`}>
              <Banknote size={24} />
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-gray-100/50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shadow-sm border border-black/5 dark:border-white/5">
              {account.type.replace('_', ' ')}
            </span>
          </div>

          <h4 className="font-black text-2xl text-gray-800 dark:text-white tracking-tight group-hover:text-primary transition-colors">
            {account.name}
          </h4>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <Coins size={14} className="opacity-70" />
            <span>Currency: <strong className="text-gray-800 dark:text-gray-200">{account.currency}</strong></span>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <div className="mb-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Current Balance</p>
            <span className="font-black text-3xl tracking-tighter text-emerald-500 dark:text-emerald-400">
              ${account.balance.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link href={`/projects/accounting/transactions/transfer?fromAccount=${account.id}`} className="p-2 rounded-xl bg-emerald-50/50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 transition-all shadow-sm" title="Transfer Money">
              <Repeat size={16} />
            </Link>
            <Link href={`/projects/accounting/accounts/${account.id}`} className="p-2 rounded-xl bg-gray-100 hover:bg-white text-gray-600 hover:text-primary dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 transition-all shadow-sm border border-transparent dark:border-gray-700" title="View Details">
              <Eye size={16} />
            </Link>
            <button onClick={() => onEdit(account.id)} className="p-2 rounded-xl bg-gray-100 hover:bg-white text-gray-600 hover:text-primary dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 transition-all shadow-sm border border-transparent dark:border-gray-700" title="Edit Account">
              <Edit size={16} />
            </button>
            <button onClick={() => onDelete(account.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-all shadow-sm" title="Delete Account">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};"""

content = re.sub(r'const AccountCard: React\.FC<.*?> = \(\{.*?\}\) => \{.*?\n\};\n', card_replacement + "\n", content, flags=re.DOTALL)

# 3. Main Return Block replacement
main_return = """  return (
    <Layout>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header - Ultra Premium */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 lg:mb-10 gap-6">
          <div>
            <Link href="/projects/accounting" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-3">
              <ArrowLeft size={16} className="mr-2" /> Ku Noqo Dashboard-ka
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              Accounts-ka
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/20 backdrop-blur-md hidden sm:inline-block">Diiwaanka Rasmiga</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Maamul dhammaan xisaabaadkaaga iyo hubi hantidaada (Bank & Cash).</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={fetchAccounts} className="p-3 bg-white/70 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700/50 backdrop-blur-md text-gray-600 hover:text-primary dark:text-gray-300 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
              <RefreshCw size={20} />
            </button>
            <Link href="/projects/accounting/accounts/add" className="group relative bg-gradient-to-r from-blue-600 to-primary text-white py-3 px-6 lg:px-8 rounded-2xl font-bold text-sm lg:text-base hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center">
              <Plus size={18} className="mr-2 group-hover:scale-125 transition-transform" /> Ku Dar Account
            </Link>
          </div>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up">
          <div className="relative p-[1px] rounded-[2rem] overflow-hidden group col-span-2 md:col-span-1 border border-white/50 dark:border-gray-700/50 shadow-lg">
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl"></div>
            <div className="relative p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 mb-3 shadow-sm border border-transparent dark:border-gray-700">
                 <Component size={24} />
              </div>
              <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 mb-1">Tirada Accounts</h4>
              <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{totalAccountsCount}</p>
            </div>
          </div>

          <div className="relative p-[1px] rounded-[2rem] overflow-hidden group col-span-2 shadow-xl border border-white/60 dark:border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/40 dark:from-gray-800/90 dark:to-gray-900/40 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
            <div className="relative p-6 flex items-center gap-6 h-full">
              <div className="p-4 bg-primary/10 rounded-[1.5rem] text-primary shadow-inner border border-primary/20">
                 <DollarSign size={32} />
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold tracking-widest uppercase text-primary mb-1">Wadarta Balance (Total)</h4>
                <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  ${totalBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-[1px] rounded-[2rem] overflow-hidden group col-span-2 md:col-span-1 border border-white/50 dark:border-gray-700/50 shadow-lg">
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl"></div>
            <div className="relative p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="flex gap-2">
                 <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-3 shadow-sm">
                    <Banknote size={20} />
                 </div>
                 <div className="p-3 bg-gray-500/10 text-gray-500 rounded-2xl mb-3 shadow-sm">
                    <Coins size={20} />
                 </div>
              </div>
              <div className="flex gap-4">
                <div>
                   <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 mb-1">Bank</h4>
                   <p className="text-2xl font-black text-emerald-500">{bankAccountsCount}</p>
                </div>
                <div>
                   <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 mb-1">Cash</h4>
                   <p className="text-2xl font-black text-gray-600 dark:text-gray-300">{cashAccountsCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bento Box */}
        <div className="relative p-[1px] rounded-[2rem] overflow-hidden mb-10 animate-fade-in group border border-white/60 dark:border-gray-700/50 shadow-sm">
           <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl"></div>
           <div className="relative p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Filter size={20} className="text-primary" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Kala Shaandheyn</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                     <Search size={16} className="text-gray-400 group-focus-within/input:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Magaca account-ka..."
                    className="w-full bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover/input:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter by Type */}
                <div className="relative group/select">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                     <TagIcon size={16} className="text-gray-400 group-focus-within/select:text-primary transition-colors" />
                  </div>
                  <select
                    className="w-full bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-10 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover/select:shadow-md cursor-pointer"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <ChevronRight size={16} className="text-gray-400 rotate-90" />
                  </div>
                </div>

                {/* Filter by Currency */}
                <div className="relative group/select">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                     <Coins size={16} className="text-gray-400 group-focus-within/select:text-primary transition-colors" />
                  </div>
                  <select
                    className="w-full bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-10 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover/select:shadow-md cursor-pointer"
                    value={filterCurrency}
                    onChange={(e) => setFilterCurrency(e.target.value)}
                  >
                    {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <ChevronRight size={16} className="text-gray-400 rotate-90" />
                  </div>
                </div>
              </div>

              {/* View Toggles & Clear */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-6">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-[10px] shadow-sm">
                    {filteredAccounts.length} Account
                 </span>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700/50">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <LayoutGrid size={16} /> Kaarar
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`hidden md:flex px-6 py-2 rounded-lg text-sm font-bold items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <List size={16} /> Liis
                  </button>
                </div>
              </div>
           </div>
        </div>

        {/* Accounts Content */}
        {pageLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-xl">
            <Loader2 className="animate-spin text-primary mb-4" size={48} /> 
            <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-sm animate-pulse">Helaya Xisaabaadka...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-xl text-center px-6">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4 text-gray-400">
               <FileX2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Account Lama Helin</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Majiro Account waafaqsan raadintada, fadlan bedel miiraha.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="hidden md:block animate-fade-in bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                  <tr>
                    {['Account', 'Nooca', 'Lacagta (Currency)', 'Balance', 'Actions'].map((head, i) => (
                       <th key={i} className={`px-4 py-5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ${i >= 3 ? 'text-right' : 'text-left'}`}>
                         {head}
                       </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50 bg-transparent">
                  {filteredAccounts.map(account => (
                    <AccountRow key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredAccounts.map(account => (
              <AccountCard key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
            ))}
          </div>
        )}
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}"""

content = re.sub(r'  return \(\s*<Layout>.*</Layout>\s*\);\s*\}\s*$', main_return + "\n", content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated accounts page!")
