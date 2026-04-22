"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/accounting/approvals?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals);
      }
    } catch (error) {
      toast.error("Waa lagu guuldareystay in la soo geliyo codsiyada");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleAction = async (id: string, actionStatus: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Ma hubtaa inaad ${actionStatus === 'APPROVED' ? 'ogolaato' : 'diiddo'} codsigan?`)) return;

    try {
      const res = await fetch(`/api/projects/accounting/approvals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionStatus })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchApprovals();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Cilad ayaa dhacday");
    }
  };

  const getActionIcon = (type: string) => {
    if (type.includes("DELETE")) return <Trash2 className="w-5 h-5 text-red-400" />;
    if (type.includes("EDIT")) return <Edit className="w-5 h-5 text-yellow-400" />;
    return <FileText className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            Codsiyada Tirtiridda (Approvals Inbox)
          </h1>
          <p className="text-gray-400 mt-1">
            Halkan ka maamul codsiyada shaqaalaha ee isbedelka xisaabaadka xiran.
          </p>
        </div>
        
        <div className="flex bg-[#1e2333] border border-gray-800 rounded-lg p-1">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
             <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === st 
                  ? "bg-gray-800 text-white shadow" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
             >
                {st === "PENDING" ? "Cusub (Pending)" : st === "APPROVED" ? "La Ogolaaday" : st === "REJECTED" ? "La Diiday" : "Dhammaan"}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 bg-[#1e2333] border border-gray-800 rounded-xl">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-16 bg-[#1e2333] border border-gray-800 rounded-xl flex flex-col items-center justify-center">
             <Clock className="w-12 h-12 text-gray-600 mb-4" />
             <h3 className="text-lg font-medium text-white mb-1">Ma jiraan codsiyo hadda</h3>
             <p className="text-gray-400 text-sm max-w-sm mx-auto">
                Marka shaqaale isku dayo inuu tirtiro xog ku jirta bil xiran, halkan ayuu codsigu kusoo dhici doonaa.
             </p>
          </div>
        ) : (
          approvals.map((req) => (
            <div key={req.id} className="bg-[#1e2333] border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-6 relative overflow-hidden group">
               {/* Status indicator bar */}
               <div className={`absolute top-0 left-0 w-1 h-full ${
                  req.status === 'PENDING' ? 'bg-yellow-500' :
                  req.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500'
               }`} />

               <div className="flex-1 space-y-4">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-[#151923] rounded-lg border border-gray-800">
                          {getActionIcon(req.type)}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-white font-medium">
                                {req.type === 'DELETE_TRANSACTION' ? 'Tirtirid (Delete)' : req.type === 'EDIT_TRANSACTION' ? 'Beddelid (Edit)' : 'Abuuris Cusub'}
                             </h3>
                             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                             }`}>
                                {req.status}
                             </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">
                             Laga soo codsaday: <span className="text-gray-200">{req.requestedBy?.fullName || 'N/A'}</span>
                          </p>
                       </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                       {format(new Date(req.createdAt), "dd MMM yyyy, HH:mm")}
                    </div>
                 </div>

                 <div className="bg-[#151923] p-4 rounded-lg border border-gray-800/50">
                    <p className="text-sm text-gray-300 font-medium mb-2 border-b border-gray-800 pb-2">
                      Sababta & Xogta la codsaday:
                    </p>
                    <p className="text-sm text-yellow-200/80 italic mb-3">"{req.reason}"</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                       <div>
                         <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Caddadka (Amount)</span>
                         <span className="text-sm font-semibold text-white">
                            {req.requestData?.amount?.toLocaleString()}
                         </span>
                       </div>
                       <div>
                         <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Nooca (Type)</span>
                         <span className="text-sm text-gray-300">{req.requestData?.type}</span>
                       </div>
                       <div className="col-span-2">
                         <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Faahfaahin (Desc)</span>
                         <span className="text-sm text-gray-300 line-clamp-1">{req.requestData?.description}</span>
                       </div>
                    </div>
                 </div>
               </div>

               {req.status === 'PENDING' && (
                 <div className="flex flex-row md:flex-col gap-2 items-center justify-center shrink-0 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
                    <button 
                      onClick={() => handleAction(req.id, 'APPROVED')}
                      className="flex-1 md:flex-none w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow"
                    >
                      <CheckCircle className="w-4 h-4" /> Ogolow (Approve)
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'REJECTED')}
                      className="flex-1 md:flex-none w-full flex items-center justify-center gap-2 bg-[#151923] hover:bg-red-500/10 text-red-400 border border-gray-800 hover:border-red-500/30 px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Diid (Reject)
                    </button>
                 </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
