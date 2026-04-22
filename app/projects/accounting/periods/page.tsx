"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Lock, Unlock, Calendar, Plus, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects/accounting/periods");
      if (res.ok) {
        const data = await res.json();
        setPeriods(data.periods);
      }
    } catch (error) {
      toast.error("Waa lagu guuldareystay in la soo geliyo bilaha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects/accounting/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          isClosed: false
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsAdding(false);
        setName("");
        setStartDate("");
        setEndDate("");
        fetchPeriods();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Cilad ayaa dhacday");
    }
  };

  const handleToggleLock = async (id: string, currentlyClosed: boolean) => {
    if (currentlyClosed) {
      if (!confirm("Ma hubtaa inaad furto bishan? Tani waxay ogolaanaysaa in isbeddel lagu sameeyo xisaabaadka.")) return;
    } else {
      if (!confirm("Ma hubtaa inaad xirto bishan? Cidina wax kama beddeli karto kadib.")) return;
    }

    try {
      const res = await fetch(`/api/projects/accounting/periods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClosed: !currentlyClosed })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchPeriods();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Cilad ayaa dhacday");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Xakamaynta Bilaha (Period Locking)
          </h1>
          <p className="text-gray-400 mt-1">
            Xir bilaha xisaabaadka si aad uga hortagto in isbeddel lagu sameeyo.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white shadow hover:bg-emerald-700 h-9 px-4 py-2"
        >
          {isAdding ? "Jooji" : <><Plus className="w-4 h-4" /> Ku dar Bil Cusub</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#1e2333] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
           <h3 className="text-lg font-medium text-white mb-4">Diiwaangeli Bil Cusub</h3>
           <form onSubmit={handleCreatePeriod} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Magaca Bisha</label>
                <input 
                  required
                  type="text" 
                  placeholder="Tusaale: March 2026"
                  className="flex h-10 w-full rounded-md border border-gray-800 bg-[#151923] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  value={name} onChange={e => setName(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Taariikhda Bilowga</label>
                <input 
                  required
                  type="date" 
                  className="flex h-10 w-full rounded-md border border-gray-800 bg-[#151923] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  value={startDate} onChange={e => setStartDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Taariikhda Dhammaadka</label>
                <div className="flex gap-2">
                  <input 
                    required
                    type="date" 
                    className="flex h-10 w-full rounded-md border border-gray-800 bg-[#151923] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                    value={endDate} onChange={e => setEndDate(e.target.value)} 
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 rounded-md font-medium transition-colors">
                    Keydi
                  </button>
                </div>
              </div>
           </form>
        </div>
      )}

      <div className="bg-[#1e2333] border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 bg-[#151923] uppercase border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Magaca Bisha</th>
                <th className="px-6 py-4 font-medium">Muddada</th>
                <th className="px-6 py-4 font-medium">Xaaladda</th>
                <th className="px-6 py-4 font-medium">Cidda Xirtay</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                 </tr>
              ) : periods.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                     <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2 opacity-50" />
                     Wali wax bil ah lama diiwaangelin
                   </td>
                 </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{period.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {format(new Date(period.startDate), 'MMM dd')} - {format(new Date(period.endDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {period.isClosed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <Lock className="w-3.5 h-3.5" /> Xiran (Locked)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Unlock className="w-3.5 h-3.5" /> Furan (Open)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {period.isClosed && period.closedBy ? (
                        <div>
                          {period.closedBy.fullName}
                          <div className="opacity-70 mt-0.5">{format(new Date(period.closedAt), 'dd/MM/yyyy HH:mm')}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button
                         onClick={() => handleToggleLock(period.id, period.isClosed)}
                         className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                           period.isClosed 
                           ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700" 
                           : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                         }`}
                       >
                         {period.isClosed ? "Fur Bisha (Unlock)" : "Xir Bisha (Lock)"}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
