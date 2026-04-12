const fs = require('fs');

let text = fs.readFileSync('app/workshop/[id]/page.tsx', 'utf8');

const targetHooks = `  // Forms states
  const [expenseType, setExpenseType] = useState('MATERIAL_NEW'); // MATERIAL_NEW, MATERIAL_STOCK, LABOR, TRANSPORT, SERVICE
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetch('/api/projects/accounts').then(res => res.json()).then(data => setAccounts(data.accounts || []));
  }, [id]);`;

const replacementHooks = `  // Forms states
  const [expenseType, setExpenseType] = useState('MATERIAL_NEW'); // MATERIAL_NEW, MATERIAL_STOCK, LABOR, TRANSPORT, SERVICE
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New Data Sources
  const [employees, setEmployees] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // New Form Fields
  const [employeeId, setEmployeeId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [stockItems, setStockItems] = useState<{productId: string, name: string, qty: number, cost: number}[]>([]);

  const [stockProductId, setStockProductId] = useState('');
  const [stockQty, setStockQty] = useState('');

  useEffect(() => {
    fetchJobDetails();
    fetch('/api/projects/accounts').then(res => res.json()).then(data => setAccounts(data.accounts || []));
    fetch('/api/projects/employees').then(res => res.json()).then(data => setEmployees(data.employees || []));
    fetch('/api/shop/vendors').then(res => res.json()).then(data => setVendors(data.vendors || []));
    fetch('/api/shop/products').then(res => res.json()).then(data => setProducts(data.products || []));
  }, [id]);`;


const targetHandleExpense = `  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Fadlan geli lacag sax ah');
    
    // Quick validation
    if (['MATERIAL_NEW', 'LABOR', 'TRANSPORT', 'SERVICE'].includes(expenseType) && !accountId) {
      return toast.error('Fadlan dooro Account-ka lacagtu ka go\\'ayso');
    }

    setSubmitting(true);
    try {
      const res = await fetch(\`/api/workshop/jobs/\${id}/expenses\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseType,
          description: description || \`Workshop \${expenseType}\`,
          amount,
          accountId
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Kharashkii si guul leh ayaa loogu daray!');
      setAmount('');
      setDescription('');
      fetchJobDetails();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };`;

const replacementHandleExpense = `  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseType !== 'MATERIAL_STOCK') {
      if (!amount || Number(amount) <= 0) return toast.error('Fadlan geli lacag sax ah');
    } else {
      if (stockItems.length === 0) return toast.error('Fadlan soo dooro ugu yaraan hal shey (Pick stock item)');
    }

    // Quick validation
    if (['MATERIAL_NEW', 'LABOR', 'TRANSPORT', 'SERVICE'].includes(expenseType) && !accountId) {
      return toast.error('Fadlan dooro Account-ka lacagtu ka go\\'ayso');
    }
    
    if (expenseType === 'LABOR' && !employeeId) return toast.error('Fadlan dooro Shaqaalaha shaqaynaya');

    setSubmitting(true);
    try {
      const payload = {
        expenseType,
        description: description || \`Workshop \${expenseType}\`,
        amount,
        accountId,
        employeeId: expenseType === 'LABOR' ? employeeId : undefined,
        vendorId: expenseType === 'MATERIAL_NEW' ? vendorId : undefined,
        stockItems: expenseType === 'MATERIAL_STOCK' ? stockItems.map(s => ({ productId: s.productId, qty: Number(s.qty) })) : undefined,
      };

      const res = await fetch(\`/api/workshop/jobs/\${id}/expenses\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Kharashkii si guul leh ayaa loogu daray!');
      setAmount('');
      setDescription('');
      setEmployeeId('');
      setVendorId('');
      setStockItems([]);
      fetchJobDetails();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStockItem = () => {
    if (!stockProductId || !stockQty) return toast.error('Dooro alaabta iyo cadadka');
    const p = products.find(prod => prod.id === stockProductId);
    if (!p) return;
    if (Number(stockQty) > p.stock) return toast.error(\`Stock-ga kuma filna. Wuxuu hayaa \${p.stock}\`);
    
    setStockItems([...stockItems, { ...p, productId: p.id, qty: Number(stockQty), cost: p.costPrice }]);
    setStockProductId('');
    setStockQty('');
  };`;


const targetForms = `                 {expenseType === 'MATERIAL_STOCK' ? (
                   <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl">
                     <p className="font-bold flex items-center gap-2"><Settings2 className="w-5 h-5"/> Coming soon</p>
                     <p className="text-sm mt-2">Daaqada laga dhex dooranayo alaabta Stock-ga way socotaa. Iminka isticmaal Formamka lacag bixinta.</p>
                   </div>
                 ) : (
                   <>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                         Description (Faahfaahinta Kharashka)
                       </label>
                       <input 
                         type="text" 
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                         placeholder={expenseType === 'TRANSPORT' ? 'e.g Taxi loogu qaaday birta' : 'Maxaa shaqadan lagu kordhiyay?'}
                         required
                       />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Amount ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-black text-gray-900 dark:text-white"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Payment Account (Okoonka Baxaya)</label>
                          <select 
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            required
                          >
                            <option value="">-- Dooro Account / Khasnad --</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (Bal: \${Number(a.balance).toLocaleString()})</option>)}
                          </select>
                        </div>
                     </div>
                     
                     <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3">
                       {/* Note: I am not building full AI receipt drag&drop here to save token limits, keeping it simple right now */}
                       <div className="flex-1 text-sm text-mediumGray flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200 border-dashed">
                         {expenseType === 'MATERIAL_NEW' ? '📝 Smart AI Receipt Upload wuu ku socdaa in lagu lifaaqo halkan...' : 'Qaybtan toos kharashka ugu geyso.'}
                       </div>
                       <button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg transition-colors disable:opacity-50 min-w-[200px]">
                         {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                         Save Cost to Job
                       </button>
                     </div>
                   </>
                 )}`;

const replacementForms = `                 {expenseType === 'MATERIAL_STOCK' ? (
                   <div className="space-y-4">
                     <div className="bg-orange-50 dark:bg-gray-900 border border-orange-200 dark:border-gray-700 p-6 rounded-xl space-y-4">
                       <h4 className="font-bold text-orange-800 dark:text-orange-400 mb-2">Soo xulo Alaabta Stock-ga</h4>
                       <div className="flex gap-4">
                         <select value={stockProductId} onChange={(e) => setStockProductId(e.target.value)} className="flex-1 p-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm dark:text-white">
                           <option value="">-- Dooro Alaabta --</option>
                           {products.map(p => <option key={p.id} value={p.id}>{p.name} - In Stock: {p.stock}</option>)}
                         </select>
                         <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="Qty" className="w-24 p-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white" min="1" />
                         <button type="button" onClick={handleAddStockItem} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-bold transition-colors">Kudar</button>
                       </div>
                       
                       {stockItems.length > 0 && (
                         <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                           <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                               <tr>
                                 <th className="p-3 font-semibold dark:text-gray-300">Item</th>
                                 <th className="p-3 font-semibold dark:text-gray-300">Qty</th>
                                 <th className="p-3 font-semibold dark:text-gray-300">Cost</th>
                                 <th className="p-3"></th>
                               </tr>
                             </thead>
                             <tbody>
                               {stockItems.map((item, idx) => (
                                 <tr key={idx} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                                   <td className="p-3 font-medium dark:text-white">{item.name}</td>
                                   <td className="p-3 dark:text-gray-300">{item.qty}</td>
                                   <td className="p-3 dark:text-gray-300">\${(item.qty * item.cost).toLocaleString()}</td>
                                   <td className="p-3 text-right">
                                     <button type="button" onClick={() => setStockItems(stockItems.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 font-bold text-xs">Saar</button>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       )}
                     </div>
                     
                     <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                       <button type="submit" disabled={submitting || stockItems.length === 0} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg transition-colors disable:opacity-50 min-w-[200px]">
                         {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                         Save Stock to Job
                       </button>
                     </div>
                   </div>
                 ) : (
                   <>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                         Description (Faahfaahinta Kharashka)
                       </label>
                       <input 
                         type="text" 
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                         placeholder={expenseType === 'TRANSPORT' ? 'e.g Taxi loogu qaaday birta' : 'Maxaa shaqadan lagu kordhiyay?'}
                         required
                       />
                     </div>

                     {expenseType === 'LABOR' && (
                       <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Shaqaalaha (Employee)</label>
                         <select 
                           value={employeeId}
                           onChange={(e) => setEmployeeId(e.target.value)}
                           className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                           required
                         >
                           <option value="">-- Dooro Shaqaalaha Dhisaya --</option>
                           {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                         </select>
                       </div>
                     )}

                     {expenseType === 'MATERIAL_NEW' && (
                       <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Vendor (Optional)</label>
                         <select 
                           value={vendorId}
                           onChange={(e) => setVendorId(e.target.value)}
                           className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                         >
                           <option value="">-- Dooro Vendor-ka --</option>
                           {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                         </select>
                       </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Amount ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-black text-gray-900 dark:text-white"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Payment Account (Okoonka Baxaya)</label>
                          <select 
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                            required
                          >
                            <option value="">-- Dooro Account / Khasnad --</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (Bal: \${Number(a.balance).toLocaleString()})</option>)}
                          </select>
                        </div>
                     </div>
                     
                     <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3">
                       <div className="flex-1 text-sm text-mediumGray flex items-center bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3 rounded-lg border border-gray-200 border-dashed">
                         {expenseType === 'MATERIAL_NEW' ? '📝 Smart AI Receipt Upload wuu ku socdaa in lagu lifaaqo halkan...' : 'Qaybtan toos kharashka ugu geyso.'}
                       </div>
                       <button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg transition-colors disable:opacity-50 min-w-[200px]">
                         {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                         Save Cost to Job
                       </button>
                     </div>
                   </>
                 )}`;

text = text.replace(targetHooks, replacementHooks);
text = text.replace(targetHandleExpense, replacementHandleExpense);
text = text.replace(targetForms, replacementForms);

if (!text.includes("setVendorId")) {
  console.log('FAIL! Some replace failed.');
} else {
  fs.writeFileSync('app/workshop/[id]/page.tsx', text, 'utf8');
  console.log('SUCCESS! File updated.');
}
