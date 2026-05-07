'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, LayoutTemplate, Palette, Info, X, Image as ImageIcon, FileText, Download } from 'lucide-react';
import Link from 'next/link';

const THEMES = [
    { id: 'blue', name: 'Modern Blue', primary: '#3498DB', secondary: '#1E293B', light: 'rgba(52,152,219,0.1)' },
    { id: 'purple', name: 'Elite Purple', primary: '#8E44AD', secondary: '#000000', light: 'rgba(142,68,173,0.1)' },
    { id: 'green', name: 'Eco Green', primary: '#2ECC71', secondary: '#145A32', light: 'rgba(46,204,113,0.1)' },
    { id: 'orange', name: 'Sunset Orange', primary: '#E67E22', secondary: '#7E5109', light: 'rgba(230,126,34,0.1)' },
    { id: 'red', name: 'Crimson Red', primary: '#E74C3C', secondary: '#641E16', light: 'rgba(231,76,60,0.1)' },
    { id: 'slate', name: 'Midnight Slate', primary: '#34495E', secondary: '#2C3E50', light: 'rgba(52,73,94,0.1)' },
    { id: 'gold', name: 'Gold Premium', primary: '#D4AF37', secondary: '#000000', light: 'rgba(212,175,55,0.1)' },
    { id: 'mono', name: 'Classic Mono', primary: '#000000', secondary: '#000000', light: 'rgba(0,0,0,0.05)' },
    { id: 'rose', name: 'Rose Gold', primary: '#B76E79', secondary: '#4A235A', light: 'rgba(183,110,121,0.1)' },
    { id: 'teal', name: 'Teal Ocean', primary: '#1ABC9C', secondary: '#0B5345', light: 'rgba(26,188,156,0.1)' },
];

export default function PrintBlankReceiptsPage() {
    const [company, setCompany] = useState<any>(null);
    const [layout, setLayout] = useState<'A4' | 'A5_TALL' | 'A5_PORTRAIT' | 'A5_WIDE'>('A5_PORTRAIT'); 
    const [themeId, setThemeId] = useState('blue');
    
    // Modal & Export States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'pdf' | 'png'>('pdf');
    const [startNo, setStartNo] = useState<string>('1');
    const [endNo, setEndNo] = useState<string>('50');
    
    // Logic States
    const [isPrinting, setIsPrinting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch('/api/shop/company');
                if (res.ok) {
                    const data = await res.json();
                    setCompany(data.company);
                }
            } catch (e) {
                console.error("Error fetching company", e);
            }
        };
        fetchCompany();
    }, []);

    const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

    // Handle PDF Print trigger after DOM is fully updated
    useEffect(() => {
        if (isPrinting) {
            const generatePDF = async () => {
                try {
                    const { jsPDF } = await import('jspdf');
                    const html2canvas = (await import('html2canvas')).default;

                    const isLandscape = layout === 'A5_PORTRAIT'; 
                    const pdf = new jsPDF({
                        orientation: isLandscape ? 'landscape' : 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const elements = Array.from(document.querySelectorAll('.page-break-inside-avoid'));
                    let currentX = 0;
                    let currentY = 0;
                    const a4Width = isLandscape ? 297 : 210;
                    const a4Height = isLandscape ? 210 : 297;

                    // Optimization: Hide all elements initially to speed up html2canvas
                    elements.forEach(el => (el as HTMLElement).style.display = 'none');

                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        // Show only the current element
                        el.style.display = 'flex';
                        
                        // Yield to main thread to update progress UI
                        setExportProgress(Math.round(((i + 1) / elements.length) * 100));
                        await new Promise(r => setTimeout(r, 10));

                        const canvas = await html2canvas(el, { scale: 2, logging: false });
                        const imgData = canvas.toDataURL('image/jpeg', 0.85); // Slightly lower quality for speed
                        
                        // Hide again
                        el.style.display = 'none';

                        let w = 210;
                        let h = 297;
                        if (layout === 'A4') { w = 210; h = 297; }
                        else if (layout === 'A5_TALL') { w = 105; h = 297; }
                        else if (layout === 'A5_PORTRAIT') { w = 148.5; h = 210; }
                        else if (layout === 'A5_WIDE') { w = 210; h = 148.5; }

                        pdf.addImage(imgData, 'JPEG', currentX, currentY, w, h);
                        
                        if (layout === 'A4') {
                            if (i < elements.length - 1) pdf.addPage();
                        } 
                        else if (layout === 'A5_PORTRAIT' || layout === 'A5_TALL') {
                            currentX += w;
                            if (currentX >= a4Width - 1) { 
                                currentX = 0;
                                if (i < elements.length - 1) pdf.addPage();
                            }
                        } 
                        else if (layout === 'A5_WIDE') {
                            currentY += h;
                            if (currentY >= a4Height - 1) {
                                currentY = 0;
                                if (i < elements.length - 1) pdf.addPage();
                            }
                        }
                    }
                    
                    // Restore all elements
                    elements.forEach(el => (el as HTMLElement).style.display = 'flex');

                    pdf.save(`Receipt_Book_${startNo}_to_${endNo}.pdf`);
                } catch (err) {
                    console.error("PDF Generation failed:", err);
                } finally {
                    setIsPrinting(false);
                    setIsExporting(false);
                    setExportProgress(0);
                    setIsModalOpen(false);
                }
            };

            const timer = setTimeout(() => {
                generatePDF();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isPrinting, layout, startNo, endNo]);

    // Export Logic
    const handleExport = async () => {
        setIsExporting(true);
        if (exportType === 'pdf') {
            setIsPrinting(true); // Trigger full array render
        } else {
            // PNG Export (Just captures the first preview element)
            setTimeout(async () => {
                const html2canvas = (await import('html2canvas')).default;
                const container = document.getElementById('preview-receipt-0');
                if (container) {
                    try {
                        const canvas = await html2canvas(container, { scale: 2 });
                        const imgData = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `Receipt_Template_${startNo || 'Blank'}.png`;
                        link.href = imgData;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (e) {
                        console.error(e);
                    }
                }
                setIsExporting(false);
                setIsModalOpen(false);
            }, 100);
        }
    };

    // Calculate Receipts Array
    let totalReceipts = 1;
    let startVal = parseInt(startNo);
    let endVal = parseInt(endNo);
    
    if (isPrinting) {
        if (!isNaN(startVal) && !isNaN(endVal) && endVal >= startVal) {
            totalReceipts = endVal - startVal + 1;
        } else if (!isNaN(endVal)) {
            totalReceipts = endVal;
            startVal = NaN; 
        } else if (!isNaN(startVal)) {
            totalReceipts = 1;
        } else {
            totalReceipts = 2; 
            startVal = NaN;
        }
    } else {
        // PREVIEW MODE: Just show enough for 1 page (or 1 receipt for PNG preview)
        totalReceipts = layout === 'A4' ? 1 : 2; 
    }

    const receiptsArray = Array.from({ length: Math.max(1, totalReceipts) });

    const getWrapperClass = () => {
        if (layout === 'A4') return 'h-[297mm] w-[210mm]';
        if (layout === 'A5_TALL') return 'h-[297mm] w-[105mm] border-r-2 border-dashed border-gray-300 float-left';
        if (layout === 'A5_PORTRAIT') return 'h-[210mm] w-[148.5mm] border-r-2 border-dashed border-gray-300 float-left';
        return 'h-[148.5mm] w-[210mm] border-b-2 border-dashed border-gray-300';
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            {/* NO-PRINT SETTINGS BAR */}
            <div className="print:hidden sticky top-0 w-full bg-white border-b shadow-sm z-50 p-4 flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/shop/manual-entry" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            Print Blank Receipt Books
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded uppercase">Pro Preview</span>
                        </h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Showing Preview Only</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* THEME */}
                    <div className="flex items-center gap-2">
                        <Palette size={16} className="text-gray-400"/>
                        <select 
                            value={themeId} 
                            onChange={(e) => setThemeId(e.target.value)}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none"
                        >
                            {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* LAYOUT */}
                    <div className="flex items-center gap-2">
                        <LayoutTemplate size={16} className="text-gray-400"/>
                        <select 
                            value={layout} 
                            onChange={(e) => setLayout(e.target.value as any)}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none"
                        >
                            <option value="A4">A4 (1/page)</option>
                            <option value="A5_PORTRAIT">A5 Portrait (2/page)</option>
                            <option value="A5_TALL">Half A4 Narrow (2/page)</option>
                            <option value="A5_WIDE">A5 Landscape (2/page)</option>
                        </select>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className="px-6 py-2.5 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Download size={18} /> Download / Export
                    </button>
                </div>
            </div>

            {/* DOWNLOAD MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-lg">Export Options</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-6">
                            {/* Format Selection */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">1. Select Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setExportType('pdf')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${exportType === 'pdf' ? 'border-[#3498DB] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <FileText size={24} className={exportType === 'pdf' ? 'text-[#3498DB]' : 'text-gray-400'} />
                                        <span className={`font-bold text-sm ${exportType === 'pdf' ? 'text-[#3498DB]' : 'text-gray-600'}`}>PDF Document</span>
                                        <span className="text-[9px] text-gray-500">Best for printing multiple</span>
                                    </button>
                                    <button 
                                        onClick={() => setExportType('png')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${exportType === 'png' ? 'border-[#3498DB] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <ImageIcon size={24} className={exportType === 'png' ? 'text-[#3498DB]' : 'text-gray-400'} />
                                        <span className={`font-bold text-sm ${exportType === 'png' ? 'text-[#3498DB]' : 'text-gray-600'}`}>PNG Image</span>
                                        <span className="text-[9px] text-gray-500">Best for sharing one</span>
                                    </button>
                                </div>
                            </div>

                            {/* Numbering */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">2. Receipt Numbering (Optional)</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 mb-1 block">Start No.</label>
                                        <input 
                                            type="number" 
                                            value={startNo} 
                                            onChange={e => setStartNo(e.target.value)}
                                            placeholder="e.g. 1" 
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none" 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 mb-1 block">End No.</label>
                                        <input 
                                            type="number" 
                                            value={endNo} 
                                            onChange={e => setEndNo(e.target.value)}
                                            placeholder="e.g. 50" 
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none" 
                                        />
                                    </div>
                                </div>
                                {exportType === 'pdf' ? (
                                    <p className="text-[10px] text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                                        <Info size={12} className="inline mr-1 -mt-0.5" />
                                        This will generate {Math.max(1, (parseInt(endNo)||1) - (parseInt(startNo)||1) + 1)} receipts across multiple pages.
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                                        <Info size={12} className="inline mr-1 -mt-0.5" />
                                        PNG export will only generate a single image of the first receipt.
                                    </p>
                                )}
                            </div>

                            <button 
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full py-3 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isExporting ? `GENERATING... ${exportProgress > 0 ? exportProgress + '%' : ''}` : <><Download size={18} /> Generate File</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINTABLE AREA */}
            <div className="print:pt-0 pb-10 print:pb-0 flex flex-col items-center">
                <div className={`print-container bg-white shadow-xl print:shadow-none relative overflow-hidden ${layout === 'A5_PORTRAIT' ? 'w-[297mm]' : 'w-[210mm]'}`}>
                    
                    <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                            @page { size: ${layout === 'A5_PORTRAIT' ? 'A4 landscape' : 'A4 portrait'}; margin: 0; }
                            body { margin: 0; padding: 0; background: white; }
                            .print-container { box-shadow: none !important; }
                            ::-webkit-scrollbar { display: none; }
                        }
                    `}} />

                    {receiptsArray.map((_, idx) => {
                        // In preview mode, use the startNo or leave blank. In print mode, calculate increment.
                        const receiptNumber = !isNaN(startVal) ? String(startVal + (isPrinting ? idx : 0)).padStart(4, '0') : '';
                        
                        return (
                        <div id={`preview-receipt-${idx}`} key={idx} className={`${getWrapperClass()} relative box-border overflow-hidden bg-white p-5 flex flex-col page-break-inside-avoid`} style={{ pageBreakInside: 'avoid' }}>
                            
                            {/* --- TEAR INDICATOR (PERFORATION) --- */}
                            <div className="absolute top-0 left-0 right-0 border-t border-dashed border-gray-300 opacity-60 flex justify-center items-center z-20">
                                <span className="bg-white px-1 text-[8px] text-gray-400 transform -translate-y-1/2">✂</span>
                            </div>

                            {/* --- BACKGROUND WATERMARK --- */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                                <div className="text-[100px] font-black uppercase transform -rotate-45" style={{ color: activeTheme.primary }}>
                                    {company?.name || 'RECEIPT'}
                                </div>
                            </div>

                            {/* --- HEADER DESIGNS --- */}
                            <div className="absolute top-0 left-0 w-64 h-32 opacity-10 rounded-br-[100px] z-0 pointer-events-none" style={{ backgroundColor: activeTheme.primary }}></div>
                            <div className="absolute top-0 right-0 w-64 h-24 rounded-bl-[100px] z-0 pointer-events-none overflow-hidden" style={{ backgroundColor: activeTheme.secondary }}>
                                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-80 blur-sm" style={{ backgroundColor: activeTheme.primary }}></div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center mb-5 mt-2">
                                <h1 className="text-2xl font-black tracking-tight uppercase leading-none" style={{ color: activeTheme.primary }}>
                                    {company?.name || 'YOUR COMPANY'}
                                </h1>
                                <p className="text-[9px] italic text-gray-500 mt-1 font-bold">Your satisfaction is our priority.</p>
                                <div className="mt-2 px-6 py-1 text-white text-[10px] font-black tracking-widest uppercase rounded-full" style={{ backgroundColor: activeTheme.secondary }}>
                                    Delivery Note / Receipt
                                </div>
                            </div>

                            {/* Meta Fields (No & Date & Name) */}
                            <div className="relative z-10 flex flex-col gap-3 mb-4">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-end gap-2">
                                        <span className="font-black text-[10px] uppercase tracking-widest text-gray-700">NO.</span>
                                        <div className="w-16 border-b border-gray-400 border-dashed text-[12px] font-black text-red-600 text-center leading-none pb-0.5">
                                            {receiptNumber}
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-black text-[10px] uppercase tracking-widest text-gray-700">Date:</span>
                                        <div className="w-20 border-b border-gray-400"></div>
                                    </div>
                                </div>
                                <div className="flex items-end gap-2 px-1">
                                    <span className="font-black text-[11px] text-gray-700">M/s</span>
                                    <div className="flex-1 border-b border-gray-400"></div>
                                </div>
                            </div>

                            {/* --- TABLE --- */}
                            <div className="relative z-10 flex-1 border-2 rounded-xl overflow-hidden flex flex-col mb-3 bg-white/80 backdrop-blur-sm" style={{ borderColor: activeTheme.primary }}>
                                {/* Header */}
                                <div className="flex border-b-2" style={{ borderColor: activeTheme.primary, backgroundColor: activeTheme.light }}>
                                    <div className="w-8 py-1.5 text-center border-r-2 font-black text-[9px] uppercase tracking-widest" style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}>NO</div>
                                    <div className="flex-1 py-1.5 text-center border-r-2 font-black text-[9px] uppercase tracking-widest" style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}>DESCRIPTION</div>
                                    <div className="w-12 py-1.5 text-center border-r-2 font-black text-[9px] uppercase tracking-widest" style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}>QTY</div>
                                    <div className="w-16 py-1.5 text-center border-r-2 font-black text-[9px] uppercase tracking-widest" style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}>PRICE</div>
                                    <div className="w-20 py-1.5 text-center font-black text-[9px] uppercase tracking-widest" style={{ color: activeTheme.primary }}>AMOUNT</div>
                                </div>

                                {/* Rows */}
                                <div className="flex-1 flex flex-col">
                                    {Array.from({ length: layout === 'A4' ? 26 : layout === 'A5_WIDE' ? 6 : 14 }).map((_, rIdx) => (
                                        <div key={rIdx} className="flex flex-1 border-b border-gray-300 last:border-b-0 min-h-[20px]">
                                            <div className="w-8 border-r-2 flex items-center justify-center text-[8px] font-black text-gray-400" style={{ borderColor: activeTheme.primary }}>{rIdx + 1}</div>
                                            <div className="flex-1 border-r-2" style={{ borderColor: activeTheme.primary }}></div>
                                            <div className="w-12 border-r-2" style={{ borderColor: activeTheme.primary }}></div>
                                            <div className="w-16 border-r-2" style={{ borderColor: activeTheme.primary }}></div>
                                            <div className="w-20"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Subtotal Row */}
                                <div className="flex border-t-2 bg-white h-5" style={{ borderColor: activeTheme.primary }}>
                                    <div className="flex-1 border-r-2 flex items-center justify-end px-3" style={{ borderColor: activeTheme.primary }}>
                                        <span className="font-black text-[8px] text-gray-500 uppercase tracking-widest">SUBTOTAL</span>
                                    </div>
                                    <div className="w-[80px] bg-white"></div>
                                </div>
                                {/* VAT Row */}
                                <div className="flex border-t border-gray-300 bg-white h-5">
                                    <div className="flex-1 border-r-2 flex items-center justify-end px-3" style={{ borderColor: activeTheme.primary }}>
                                        <span className="font-black text-[8px] text-gray-500 uppercase tracking-widest">VAT %</span>
                                    </div>
                                    <div className="w-[80px] bg-white"></div>
                                </div>

                                {/* Total Row */}
                                <div className="flex border-t-2 h-7" style={{ borderColor: activeTheme.primary, backgroundColor: activeTheme.light }}>
                                    <div className="flex-1 border-r-2 flex items-center justify-end px-3" style={{ borderColor: activeTheme.primary }}>
                                        <span className="font-black text-[10px] uppercase tracking-widest" style={{ color: activeTheme.primary }}>GRAND TOTAL</span>
                                    </div>
                                    <div className="w-[80px]" style={{ backgroundColor: activeTheme.light }}></div>
                                </div>
                            </div>

                            <div className="text-center text-[8px] italic font-bold text-gray-500 mb-2 relative z-10">
                                Goods once sold are not re-accepted.
                            </div>

                            {/* --- AI COMPATIBILITY ZONE (Compact) --- */}
                            <div className="relative z-10 p-2 border border-gray-300 rounded-lg bg-gray-50 mb-3 shadow-inner">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white"></div>
                                            <span className="text-[8px] font-black uppercase text-gray-700">Paid Full</span>
                                        </label>
                                        <label className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white"></div>
                                            <span className="text-[8px] font-black uppercase text-orange-600">Partial</span>
                                        </label>
                                        <label className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white"></div>
                                            <span className="text-[8px] font-black uppercase text-red-600">Debt</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-end gap-2 w-full">
                                        <span className="text-[8px] font-black uppercase text-gray-600 w-16">Amount Paid:</span>
                                        <div className="flex-1 border-b border-gray-400 border-dashed bg-white h-4"></div>
                                    </div>
                                    <div className="flex items-end gap-2 w-full">
                                        <span className="text-[8px] font-black uppercase text-gray-600 w-16">Deposit Acc:</span>
                                        <div className="flex-1 border-b border-gray-400 border-dashed bg-white h-4"></div>
                                    </div>
                                    <div className="flex items-end gap-2 w-full mt-1">
                                        <span className="text-[8px] font-black uppercase text-gray-600 w-16">Signature:</span>
                                        <div className="flex-1 border-b border-gray-400"></div>
                                    </div>
                                </div>
                            </div>

                            {/* --- FOOTER / CONTACT INFO --- */}
                            <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-auto pt-2 border-t border-gray-200">
                                {company?.address && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600">
                                        <span style={{ color: activeTheme.primary }}>📍</span> {company.address}
                                    </div>
                                )}
                                {company?.phone && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600">
                                        <span style={{ color: activeTheme.primary }}>📞</span> {company.phone}
                                    </div>
                                )}
                                {company?.tin && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600">
                                        <span style={{ color: activeTheme.primary }}>🏢</span> TIN: {company.tin}
                                    </div>
                                )}
                                {company?.email && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600">
                                        <span style={{ color: activeTheme.primary }}>✉️</span> {company.email}
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
