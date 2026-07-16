"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    FolderPlus, CloudLightning, Search, RefreshCw, Upload,
    FileSpreadsheet, FileText, Loader2, Database,
    Laptop, Calendar, CheckCircle2, ShieldAlert,
    FolderOpen, X, Clock, HelpCircle, Pencil, Trash2,
    ArrowLeft
} from 'lucide-react';

interface QcManagementPanelProps {
    customerId: number | null;
}

export default function QcManagementPanel({ customerId }: QcManagementPanelProps) {
    const [loading, setLoading] = useState(false);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [activeBatchCode, setActiveBatchCode] = useState('');
    const [searchBatchCode, setSearchBatchCode] = useState('');
    const [records, setRecords] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    // List of batches from DB
    const [batches, setBatches] = useState<any[]>([]);
    // List of batches created locally (empty ones)
    const [localBatches, setLocalBatches] = useState<string[]>([]);

    // Custom UI Modals State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [inputBatchCode, setInputBatchCode] = useState('');
    const [formSerialNumber, setFormSerialNumber] = useState('');
    
    // Rename states
    const [oldBatchName, setOldBatchName] = useState('');
    const [newBatchName, setNewBatchName] = useState('');

    // Edit specs by serial states
    const [editSerialNumber, setEditSerialNumber] = useState('');
    const [searchEditLoading, setSearchEditLoading] = useState(false);
    const [editRecord, setEditRecord] = useState<any | null>(null);
    const [saveEditLoading, setSaveEditLoading] = useState(false);

    // Form inputs for edit
    const [formProductName, setFormProductName] = useState('');
    const [formCpu, setFormCpu] = useState('');
    const [formRam, setFormRam] = useState('');
    const [formSsd, setFormSsd] = useState('');
    const [formGraphics, setFormGraphics] = useState('');
    const [formBattery, setFormBattery] = useState('');
    const [formWindowsVer, setFormWindowsVer] = useState('');
    const [formBatchCode, setFormBatchCode] = useState('');

    useEffect(() => {
        if (customerId) {
            // Load active batch from localStorage if available
            const storedBatch = localStorage.getItem(`active_batch_${customerId}`);
            if (storedBatch) {
                setActiveBatchCode(storedBatch);
                setSearchBatchCode(storedBatch);
                fetchBatchSpecs(storedBatch);
            }

            // Load local created empty batches from localStorage
            const storedLocalBatches = localStorage.getItem(`local_batches_${customerId}`);
            if (storedLocalBatches) {
                setLocalBatches(JSON.parse(storedLocalBatches));
            }

            fetchBatches();
        }
    }, [customerId]);

    const fetchBatches = async () => {
        if (!customerId) return;
        setBatchesLoading(true);
        try {
            const res = await fetch(`/api/customer/qc-batches?customerId=${customerId}`);
            if (res.ok) {
                const data = await res.json();
                setBatches(data);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
        } finally {
            setBatchesLoading(false);
        }
    };

    const fetchBatchSpecs = async (batchCode: string) => {
        if (!customerId || !batchCode.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/customer/qc-specs?customerId=${customerId}&batchCode=${encodeURIComponent(batchCode.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
                setSearched(true);
            } else {
                toast.error('Failed to load batch specifications.');
            }
        } catch (error) {
            console.error('Error fetching batch specs:', error);
            toast.error('An error occurred while loading specs.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = inputBatchCode.trim();
        if (!cleanCode) {
            toast.error('Batch Code cannot be empty.');
            return;
        }

        // Add to local batches if it doesn't exist in DB or local list
        const existsInDb = batches.some(b => b.batchCode.toLowerCase() === cleanCode.toLowerCase());
        const existsInLocal = localBatches.some(b => b.toLowerCase() === cleanCode.toLowerCase());
        
        if (!existsInDb && !existsInLocal) {
            const updatedLocal = [cleanCode, ...localBatches];
            setLocalBatches(updatedLocal);
            localStorage.setItem(`local_batches_${customerId}`, JSON.stringify(updatedLocal));
        }

        setActiveBatchCode(cleanCode);
        setSearchBatchCode(cleanCode);
        localStorage.setItem(`active_batch_${customerId}`, cleanCode);
        
        toast.success(`Active batch set to: ${cleanCode}`);
        setIsCreateModalOpen(false);
        setInputBatchCode('');
        fetchBatchSpecs(cleanCode);
        fetchBatches();
    };

    const handleLookupBatchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = inputBatchCode.trim();
        if (!cleanCode) {
            toast.error('Please enter a Batch Code.');
            return;
        }

        setSearchBatchCode(cleanCode);
        setIsLookupModalOpen(false);
        setInputBatchCode('');
        fetchBatchSpecs(cleanCode);
    };

    const handleLookupActiveBatch = () => {
        if (!activeBatchCode) {
            toast.error("No active batch code is set. Click 'Create Batch' to configure one.");
            return;
        }
        setSearchBatchCode(activeBatchCode);
        fetchBatchSpecs(activeBatchCode);
    };

    const handleRefresh = () => {
        const codeToRefresh = searchBatchCode || activeBatchCode;
        if (!codeToRefresh) {
            toast.error("No batch is currently selected for refresh.");
            return;
        }
        fetchBatchSpecs(codeToRefresh);
        fetchBatches();
        toast.success("Sync records refreshed.");
    };

    const handleExportExcel = () => {
        if (records.length === 0) {
            toast.error("No records available to export. Search or select a batch first.");
            return;
        }

        const headers = 'Date & Time,Session ID,Serial Number,Product Name,CPU,RAM,SSD,Graphics,Battery,Windows Version,Operator\n';
        const csvContent = headers + records.map(r => {
            const s = r.specs || {};
            const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
            return `${escape(r.timestamp)},${escape(r.sessionId)},${escape(s.serialNumber)},${escape(s.productName)},${escape(s.cpu)},${escape(s.ram)},${escape(s.ssd)},${escape(s.graphics)},${escape(s.battery)},${escape(s.windowsVer)},${escape(r.operator)}`;
        }).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `QC_Batch_${searchBatchCode || activeBatchCode || 'Export'}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV export downloaded successfully.");
    };

    const handlePrintPdf = () => {
        if (records.length === 0) {
            toast.error("No records available to print. Search or select a batch first.");
            return;
        }

        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (printWindow) {
            const rowsHtml = records.map((r, i) => {
                const s = r.specs || {};
                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${new Date(r.timestamp).toLocaleString()}</td>
                        <td>${s.serialNumber || 'N/A'}</td>
                        <td>${s.productName || 'N/A'}</td>
                        <td>${s.cpu || 'N/A'}</td>
                        <td>${s.ram || 'N/A'}</td>
                        <td>${s.ssd || 'N/A'}</td>
                        <td>${s.battery || 'N/A'}</td>
                        <td>${r.operator || 'N/A'}</td>
                    </tr>
                `;
            }).join('');

            printWindow.document.write(`
                <html>
                <head>
                  <title>BIZZ CO HUB - QC BATCH REPORT</title>
                  <style>
                    body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-title { margin: 0; font-size: 24px; color: #2563eb; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
                    .subtitle { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
                    .batch-info { font-size: 14px; color: #334155; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                    th { background-color: #f8fafc; font-weight: 700; color: #475569; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div>
                      <h1 class="logo-title">Bizz Co Hub</h1>
                      <p class="subtitle">Hardware Diagnostics & Batch Sync Report</p>
                    </div>
                    <div class="batch-info" style="text-align: right;">
                      <strong>Batch Code:</strong> ${searchBatchCode || activeBatchCode || 'N/A'}<br>
                      <strong>Total Devices:</strong> ${records.length}<br>
                      <strong>Date Generated:</strong> ${new Date().toLocaleDateString()}
                    </div>
                  </div>
                  
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Sync Date</th>
                        <th>Serial Number</th>
                        <th>Product Name</th>
                        <th>Processor</th>
                        <th>Memory (RAM)</th>
                        <th>Storage (SSD)</th>
                        <th>Battery Health</th>
                        <th>Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                  
                  <div class="footer">
                    © ${new Date().getFullYear()} Bizz Co Hub Systems. All hardware diagnostic results synced via BC Elite QC Client.
                  </div>
                  <script>
                    window.onload = function() {
                      window.print();
                      setTimeout(function() { window.close(); }, 500);
                    };
                  </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleDeleteBatch = async (batchCode: string) => {
        if (!confirm(`Are you sure you want to permanently delete batch "${batchCode}"? This will delete all synced device specifications under this batch.`)) {
            return;
        }

        setLoading(true);
        try {
            // Delete locally if it was only local
            const existsInLocal = localBatches.some(b => b.toLowerCase() === batchCode.toLowerCase());
            if (existsInLocal) {
                const updatedLocal = localBatches.filter(b => b.toLowerCase() !== batchCode.toLowerCase());
                setLocalBatches(updatedLocal);
                localStorage.setItem(`local_batches_${customerId}`, JSON.stringify(updatedLocal));
            }

            // Call API to delete from DB
            const res = await fetch('/api/customer/qc-batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    action: 'delete',
                    batchCode
                })
            });

            if (res.ok) {
                toast.success(`Batch "${batchCode}" deleted successfully.`);
                
                // Reset active batch if it was the one deleted
                if (activeBatchCode === batchCode) {
                    setActiveBatchCode('');
                    localStorage.removeItem(`active_batch_${customerId}`);
                }
                if (searchBatchCode === batchCode) {
                    setSearchBatchCode('');
                    setRecords([]);
                    setSearched(false);
                }

                fetchBatches();
            } else {
                toast.error('Failed to delete batch from database.');
            }
        } catch (error) {
            console.error('Delete batch error:', error);
            toast.error('An error occurred during deletion.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRenameModal = (batchCode: string) => {
        setOldBatchName(batchCode);
        setNewBatchName(batchCode);
        setIsRenameModalOpen(true);
    };

    const handleRenameBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanNew = newBatchName.trim();
        if (!cleanNew) {
            toast.error('New batch name cannot be empty.');
            return;
        }

        if (cleanNew.toLowerCase() === oldBatchName.toLowerCase()) {
            setIsRenameModalOpen(false);
            return;
        }

        setLoading(true);
        try {
            // Rename locally if exists
            const existsInLocal = localBatches.some(b => b.toLowerCase() === oldBatchName.toLowerCase());
            if (existsInLocal) {
                const updatedLocal = localBatches.map(b => b.toLowerCase() === oldBatchName.toLowerCase() ? cleanNew : b);
                setLocalBatches(updatedLocal);
                localStorage.setItem(`local_batches_${customerId}`, JSON.stringify(updatedLocal));
            }

            // Call API to rename in DB
            const res = await fetch('/api/customer/qc-batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    action: 'rename',
                    oldBatchCode: oldBatchName,
                    newBatchCode: cleanNew
                })
            });

            if (res.ok) {
                toast.success(`Batch successfully renamed to "${cleanNew}".`);
                
                // Update active batch if it was the one renamed
                if (activeBatchCode === oldBatchName) {
                    setActiveBatchCode(cleanNew);
                    localStorage.setItem(`active_batch_${customerId}`, cleanNew);
                }
                if (searchBatchCode === oldBatchName) {
                    setSearchBatchCode(cleanNew);
                }

                setIsRenameModalOpen(false);
                fetchBatches();
                fetchBatchSpecs(cleanNew);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to rename batch.');
            }
        } catch (error) {
            console.error('Rename batch error:', error);
            toast.error('An error occurred while renaming.');
        } finally {
            setLoading(false);
        }
    };

    // Edit device spec handlers
    const handleRetrieveDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        const sn = editSerialNumber.trim();
        if (!sn) {
            toast.error('Please enter a Serial Number.');
            return;
        }

        setSearchEditLoading(true);
        try {
            const res = await fetch(`/api/customer/qc-device?customerId=${customerId}&serialNumber=${encodeURIComponent(sn)}`);
            if (res.ok) {
                const data = await res.json();
                setEditRecord(data);
                
                // Populate forms
                const s = data.specs || {};
                setFormProductName(s.productName || '');
                setFormCpu(s.cpu || '');
                setFormRam(s.ram || '');
                setFormSsd(s.ssd || '');
                setFormGraphics(s.graphics || '');
                setFormBattery(s.battery || '');
                setFormWindowsVer(s.windowsVer || '');
                setFormBatchCode(data.batchCode || '');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Serial Number not found under your operator logs.');
            }
        } catch (error) {
            console.error('Retrieve spec error:', error);
            toast.error('Failed to retrieve device specification.');
        } finally {
            setSearchEditLoading(false);
        }
    };

    const handleSaveDeviceEdits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editRecord) return;

        setSaveEditLoading(true);
        try {
            const updatedSpecs = {
                ...editRecord.specs,
                productName: formProductName.trim(),
                cpu: formCpu.trim(),
                ram: formRam.trim(),
                ssd: formSsd.trim(),
                graphics: formGraphics.trim(),
                battery: formBattery.trim(),
                windowsVer: formWindowsVer.trim(),
                serialNumber: editRecord.specs.serialNumber // locks serial
            };

            const res = await fetch('/api/customer/qc-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    recordId: editRecord.id,
                    updatedSpecs,
                    batchCode: formBatchCode.trim()
                })
            });

            if (res.ok) {
                toast.success('Device diagnostics successfully updated.');
                setIsUpdateModalOpen(false);
                setEditRecord(null);
                setEditSerialNumber('');
                
                // Refresh records list
                if (searchBatchCode) {
                    fetchBatchSpecs(searchBatchCode);
                }
                fetchBatches();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save changes.');
            }
        } catch (error) {
            console.error('Save device error:', error);
            toast.error('An error occurred while saving.');
        } finally {
            setSaveEditLoading(false);
        }
    };

    const handleUploadDeviceSpecs = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSerialNumber.trim()) {
            toast.error('Serial Number is required.');
            return;
        }

        setSaveEditLoading(true);
        try {
            const updatedSpecs = {
                serialNumber: formSerialNumber.trim(),
                productName: formProductName.trim(),
                cpu: formCpu.trim(),
                ram: formRam.trim(),
                ssd: formSsd.trim(),
                graphics: formGraphics.trim(),
                battery: formBattery.trim(),
                windowsVer: formWindowsVer.trim()
            };

            const res = await fetch('/api/customer/qc-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    updatedSpecs,
                    batchCode: formBatchCode.trim()
                })
            });

            if (res.ok) {
                toast.success('Device diagnostics successfully uploaded.');
                setIsUploadModalOpen(false);
                setFormSerialNumber('');
                setFormProductName('');
                setFormCpu('');
                setFormRam('');
                setFormSsd('');
                setFormGraphics('');
                setFormBattery('');
                setFormWindowsVer('');
                setFormBatchCode('');
                
                // Refresh records list
                if (searchBatchCode) {
                    fetchBatchSpecs(searchBatchCode);
                }
                fetchBatches();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to upload device details.');
            }
        } catch (error) {
            console.error('Upload device error:', error);
            toast.error('An error occurred while uploading.');
        } finally {
            setSaveEditLoading(false);
        }
    };


    // Combine local batches (not uploaded yet) and database batches (with counts)
    const getCombinedBatchesList = () => {
        const combined = [...batches];
        
        localBatches.forEach(localCode => {
            const exists = batches.some(b => b.batchCode.toLowerCase() === localCode.toLowerCase());
            if (!exists) {
                combined.push({
                    batchCode: localCode,
                    deviceCount: 0,
                    lastUpdated: null
                });
            }
        });
        
        return combined;
    };

    const combinedBatches = getCombinedBatchesList();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Active Batch Summary Banner */}
            <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid var(--profile-card-border)',
                background: 'var(--profile-input-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--profile-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Database size={20} />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--profile-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Active Sync Batch
                        </span>
                        <strong style={{ fontSize: '15px', color: 'var(--profile-text-main)' }}>
                            {activeBatchCode || 'None (Create or assign batch below)'}
                        </strong>
                    </div>
                </div>
            </div>

            {/* Dashboard Actions Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
            }}>
                {/* Action 1: Create Batch */}
                <div 
                    onClick={() => {
                        setInputBatchCode('');
                        setIsCreateModalOpen(true);
                    }}
                    style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--profile-card-border)',
                        background: 'var(--profile-input-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    className="qc-action-card"
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--profile-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FolderPlus size={20} />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--profile-text-main)' }}>Create Batch</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>Set active Batch Code</span>
                    </div>
                </div>

                {/* Action 2: View Batch Details */}
                <div 
                    onClick={handleLookupActiveBatch}
                    style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--profile-card-border)',
                        background: 'var(--profile-input-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    className="qc-action-card"
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CloudLightning size={20} />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--profile-text-main)' }}>View Batch</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>Load active batch records</span>
                    </div>
                </div>

                {/* Action 3: History Lookup */}
                <div 
                    onClick={() => {
                        setInputBatchCode('');
                        setIsLookupModalOpen(true);
                    }}
                    style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--profile-card-border)',
                        background: 'var(--profile-input-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    className="qc-action-card"
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Search size={20} />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--profile-text-main)' }}>History Lookup</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>Search batch spec records</span>
                    </div>
                </div>

                {/* Action 4: Update Details */}
                <div 
                    onClick={() => {
                        setEditSerialNumber('');
                        setEditRecord(null);
                        setIsUpdateModalOpen(true);
                    }}
                    style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--profile-card-border)',
                        background: 'var(--profile-input-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    className="qc-action-card"
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'rgba(249, 115, 22, 0.1)',
                        color: '#f97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <RefreshCw size={20} />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--profile-text-main)' }}>Update Details</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>Edit specs by Serial Number</span>
                    </div>
                </div>

                {/* Action 5: Details Upload */}
                <div 
                    onClick={() => {
                        setFormSerialNumber('');
                        setFormProductName('');
                        setFormCpu('');
                        setFormRam('');
                        setFormSsd('');
                        setFormGraphics('');
                        setFormBattery('');
                        setFormWindowsVer('');
                        setFormBatchCode(activeBatchCode || '');
                        setIsUploadModalOpen(true);
                    }}
                    style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--profile-card-border)',
                        background: 'var(--profile-input-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    className="qc-action-card"
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'rgba(255, 149, 0, 0.1)',
                        color: '#f97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Upload size={20} />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--profile-text-main)' }}>Details Upload</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>Upload new specs manually</span>
                    </div>
                </div>
            </div>

            {/* Created/Synced Batches Display Section */}
            <div style={{ marginTop: '12px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '600', marginBottom: '14px', color: 'var(--profile-text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderOpen size={16} /> Created & Synced Batches
                </h3>
                
                {batchesLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0', gap: '8px' }}>
                        <Loader2 className="animate-spin" size={16} style={{ color: 'var(--profile-accent)' }} />
                        <span style={{ color: 'var(--profile-text-muted)', fontSize: '0.85rem' }}>Loading batches...</span>
                    </div>
                ) : combinedBatches.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--profile-card-border)', borderRadius: '12px', color: 'var(--profile-text-muted)', fontSize: '13px' }}>
                        No batches created yet. Click 'Create Batch' to get started.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '12px'
                    }}>
                        {combinedBatches.map((b) => (
                            <div 
                                key={b.batchCode}
                                onClick={() => {
                                    setActiveBatchCode(b.batchCode);
                                    setSearchBatchCode(b.batchCode);
                                    localStorage.setItem(`active_batch_${customerId}`, b.batchCode);
                                    fetchBatchSpecs(b.batchCode);
                                }}
                                className={`qc-batch-item ${activeBatchCode === b.batchCode ? 'active' : ''}`}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div>
                                        <strong style={{ fontSize: '13.5px', color: 'var(--profile-text-main)', display: 'block' }}>{b.batchCode}</strong>
                                        <span style={{ fontSize: '11.5px', color: 'var(--profile-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <Laptop size={12} /> {b.deviceCount} synced device{b.deviceCount === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                                        {/* Rename Batch */}
                                        <button 
                                            title="Rename Batch"
                                            onClick={() => handleOpenRenameModal(b.batchCode)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--profile-text-muted)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '4px',
                                                transition: 'color 0.2s'
                                            }}
                                            className="qc-batch-action-btn hover-accent"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        
                                        {/* Delete Batch */}
                                        <button 
                                            title="Delete Batch"
                                            onClick={() => handleDeleteBatch(b.batchCode)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--profile-text-muted)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '4px',
                                                transition: 'color 0.2s'
                                            }}
                                            className="qc-batch-action-btn hover-red"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Results Table Section */}
            {searched && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--profile-card-border)', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--profile-text-main)', margin: 0 }}>
                                Sync Details for: <strong style={{ color: 'var(--profile-accent)' }}>{searchBatchCode || activeBatchCode}</strong> ({records.length} devices)
                            </h3>
                            <button 
                                onClick={handleRefresh}
                                title="Refresh active specs list"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--profile-text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px',
                                    borderRadius: '50%'
                                }}
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Excel / PDF Action Buttons */}
                        {records.length > 0 && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={handleExportExcel}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        background: 'var(--profile-input-bg)',
                                        border: '1px solid var(--profile-card-border)',
                                        color: 'var(--profile-text-main)',
                                        fontWeight: '600',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer'
                                    }}
                                    className="qc-export-btn"
                                >
                                    <FileSpreadsheet size={15} style={{ color: '#107c41' }} /> Excel
                                </button>
                                <button 
                                    onClick={handlePrintPdf}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        background: 'var(--profile-input-bg)',
                                        border: '1px solid var(--profile-card-border)',
                                        color: 'var(--profile-text-main)',
                                        fontWeight: '600',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer'
                                    }}
                                    className="qc-export-btn"
                                >
                                    <FileText size={15} style={{ color: '#e02424' }} /> Report PDF
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px' }}>
                            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--profile-accent)' }} />
                            <span style={{ color: 'var(--profile-text-muted)', fontSize: '0.9rem' }}>Fetching records...</span>
                        </div>
                    ) : records.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--profile-card-border)', borderRadius: '12px', color: 'var(--profile-text-muted)', fontSize: '13px' }}>
                            This batch does not contain any device specifications yet. Set it as active in the desktop client and upload diagnostic logs.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid var(--profile-card-border)', borderRadius: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--profile-input-bg)', borderBottom: '1px solid var(--profile-card-border)' }}>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--profile-text-muted)' }}>Product</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--profile-text-muted)' }}>Serial Number</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--profile-text-muted)' }}>Processor / OS</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--profile-text-muted)' }}>Memory / SSD</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--profile-text-muted)' }}>Battery</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--profile-text-muted)' }}>Sync Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => {
                                        const s = r.specs || {};
                                        return (
                                            <tr key={i} style={{ borderBottom: i < records.length - 1 ? '1px solid var(--profile-card-border)' : 'none', color: 'var(--profile-text-main)' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Laptop size={15} style={{ color: 'var(--profile-accent)' }} />
                                                        <strong style={{ fontWeight: '500' }}>{s.productName || 'Unknown Device'}</strong>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <code style={{ fontSize: '12px', background: 'rgba(120, 120, 128, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {s.serialNumber || 'N/A'}
                                                    </code>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                                    {s.cpu || 'N/A'}<br/>
                                                    <span style={{ color: 'var(--profile-text-muted)', fontSize: '11px' }}>{s.windowsVer || 'N/A'}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                                    RAM: {s.ram || 'N/A'}<br/>
                                                    SSD: {s.ssd || 'N/A'}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>{s.battery || 'N/A'}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '11.5px', color: 'var(--profile-text-muted)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={12} />
                                                        {new Date(r.timestamp).toLocaleDateString()}<br/>
                                                    </div>
                                                    <span style={{ fontSize: '10.5px' }}>by {r.operator || 'N/A'}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Modal: Create Batch */}
            {isCreateModalOpen && (
                <div className="qc-modal-overlay">
                    <div className="qc-modal-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--profile-text-main)' }}>Create Sync Batch</h4>
                            <X 
                                size={18} 
                                style={{ cursor: 'pointer', color: 'var(--profile-text-muted)' }} 
                                onClick={() => setIsCreateModalOpen(false)} 
                            />
                        </div>
                        <form onSubmit={handleCreateBatchSubmit} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Batch Code Prefix / ID</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. BATCH-A, LOT-2026, etc."
                                    value={inputBatchCode}
                                    onChange={e => setInputBatchCode(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <span style={{ fontSize: '11px', color: 'var(--profile-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                                    Batch Code allows matching logs uploaded from different workstation clients under the same category label.
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    style={{
                                        padding: '8px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--profile-card-border)',
                                        background: 'transparent',
                                        color: 'var(--profile-text-main)',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="save-btn" 
                                    style={{ margin: 0, padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}
                                >
                                    Set Active Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Modal: History Lookup */}
            {isLookupModalOpen && (
                <div className="qc-modal-overlay">
                    <div className="qc-modal-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--profile-text-main)' }}>Search Synced Batches</h4>
                            <X 
                                size={18} 
                                style={{ cursor: 'pointer', color: 'var(--profile-text-muted)' }} 
                                onClick={() => setIsLookupModalOpen(false)} 
                            />
                        </div>
                        <form onSubmit={handleLookupBatchSubmit} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Enter Batch Code to search</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Enter batch code..."
                                    value={inputBatchCode}
                                    onChange={e => setInputBatchCode(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <span style={{ fontSize: '11px', color: 'var(--profile-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                                    Directly queries synced hardware diagnostics uploaded under this specific batch.
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsLookupModalOpen(false)}
                                    style={{
                                        padding: '8px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--profile-card-border)',
                                        background: 'transparent',
                                        color: 'var(--profile-text-main)',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="save-btn" 
                                    style={{ margin: 0, padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}
                                >
                                    Search Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Modal: Rename Batch */}
            {isRenameModalOpen && (
                <div className="qc-modal-overlay">
                    <div className="qc-modal-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--profile-text-main)' }}>Rename Sync Batch</h4>
                            <X 
                                size={18} 
                                style={{ cursor: 'pointer', color: 'var(--profile-text-muted)' }} 
                                onClick={() => setIsRenameModalOpen(false)} 
                            />
                        </div>
                        <form onSubmit={handleRenameBatchSubmit} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">New Batch Name / Code</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Enter new batch name..."
                                    value={newBatchName}
                                    onChange={e => setNewBatchName(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <span style={{ fontSize: '11px', color: 'var(--profile-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                                    Renaming a batch updates all device specification records mapped under this batch code.
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsRenameModalOpen(false)}
                                    style={{
                                        padding: '8px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--profile-card-border)',
                                        background: 'transparent',
                                        color: 'var(--profile-text-main)',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="save-btn" 
                                    style={{ margin: 0, padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}
                                >
                                    Rename Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Modal: Update Details (Search & Edit Device specs) */}
            {isUpdateModalOpen && (
                <div className="qc-modal-overlay">
                    <div className="qc-modal-card" style={{ maxWidth: editRecord ? '650px' : '460px', transition: 'max-width 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--profile-text-main)' }}>
                                {editRecord ? 'Edit Device Specifications' : 'Update Device Details'}
                            </h4>
                            <X 
                                size={18} 
                                style={{ cursor: 'pointer', color: 'var(--profile-text-muted)' }} 
                                onClick={() => {
                                    setIsUpdateModalOpen(false);
                                    setEditRecord(null);
                                    setEditSerialNumber('');
                                }} 
                            />
                        </div>

                        {!editRecord ? (
                            /* Step 1: Retrieve Device by Serial Number */
                            <form onSubmit={handleRetrieveDevice} className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Device Serial Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Paste or enter serial number..."
                                        value={editSerialNumber}
                                        onChange={e => setEditSerialNumber(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--profile-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                                        Lookup dynamic diagnostic records synced for this machine to perform modifications.
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsUpdateModalOpen(false);
                                            setEditSerialNumber('');
                                        }}
                                        style={{
                                            padding: '8px 18px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--profile-card-border)',
                                            background: 'transparent',
                                            color: 'var(--profile-text-main)',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="save-btn" 
                                        style={{ margin: 0, padding: '8px 24px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        disabled={searchEditLoading}
                                    >
                                        {searchEditLoading && <Loader2 size={14} className="animate-spin" />} Retrieve Specs
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Step 2: Edit Form Fields column-wise */
                            <form onSubmit={handleSaveDeviceEdits} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Serial Number (Locked)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={editRecord.specs.serialNumber} 
                                        disabled 
                                        style={{ opacity: 0.7, background: 'rgba(0,0,0,0.05)' }} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formProductName}
                                        onChange={e => setFormProductName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Processor (CPU)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formCpu}
                                        onChange={e => setFormCpu(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Memory (RAM)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formRam}
                                        onChange={e => setFormRam(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Storage (SSD)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formSsd}
                                        onChange={e => setFormSsd(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Graphics Card</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formGraphics}
                                        onChange={e => setFormGraphics(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Battery Health</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formBattery}
                                        onChange={e => setFormBattery(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Windows Version</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formWindowsVer}
                                        onChange={e => setFormWindowsVer(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Batch Code Mapping</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formBatchCode}
                                        onChange={e => setFormBatchCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--profile-card-border)', paddingTop: '16px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditRecord(null)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--profile-card-border)',
                                            background: 'transparent',
                                            color: 'var(--profile-text-main)',
                                            fontWeight: '600',
                                            fontSize: '12.5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsUpdateModalOpen(false);
                                                setEditRecord(null);
                                                setEditSerialNumber('');
                                            }}
                                            style={{
                                                padding: '8px 18px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--profile-card-border)',
                                                background: 'transparent',
                                                color: 'var(--profile-text-main)',
                                                fontWeight: '600',
                                                fontSize: '12.5px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="save-btn" 
                                            style={{ margin: 0, padding: '8px 24px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            disabled={saveEditLoading}
                                        >
                                            {saveEditLoading && <Loader2 size={14} className="animate-spin" />} Save Specs
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Modal: Details Upload */}
            {isUploadModalOpen && (
                <div className="qc-modal-overlay">
                    <div className="qc-modal-card" style={{ maxWidth: '650px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--profile-text-main)' }}>
                                Details Upload (Manual Spec Entry)
                            </h4>
                            <X 
                                size={18} 
                                style={{ cursor: 'pointer', color: 'var(--profile-text-muted)' }} 
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setFormSerialNumber('');
                                    setFormProductName('');
                                    setFormCpu('');
                                    setFormRam('');
                                    setFormSsd('');
                                    setFormGraphics('');
                                    setFormBattery('');
                                    setFormWindowsVer('');
                                    setFormBatchCode('');
                                }} 
                            />
                        </div>

                        <form onSubmit={handleUploadDeviceSpecs} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Serial Number</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Enter serial number..."
                                    value={formSerialNumber}
                                    onChange={e => setFormSerialNumber(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. HP EliteBook 840 G8..."
                                    value={formProductName}
                                    onChange={e => setFormProductName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Processor (CPU)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. Intel Core i7-1185G7..."
                                    value={formCpu}
                                    onChange={e => setFormCpu(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Memory (RAM)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. 16 GB..."
                                    value={formRam}
                                    onChange={e => setFormRam(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Storage (SSD)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. 512 GB NVMe SSD..."
                                    value={formSsd}
                                    onChange={e => setFormSsd(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Graphics Card</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. Intel Iris Xe Graphics..."
                                    value={formGraphics}
                                    onChange={e => setFormGraphics(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Battery Health</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. 88%..."
                                    value={formBattery}
                                    onChange={e => setFormBattery(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Windows Version</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. Windows 11 Pro..."
                                    value={formWindowsVer}
                                    onChange={e => setFormWindowsVer(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch Code Mapping</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. BATCH-A..."
                                    value={formBatchCode}
                                    onChange={e => setFormBatchCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--profile-card-border)', paddingTop: '16px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsUploadModalOpen(false);
                                        setFormSerialNumber('');
                                        setFormProductName('');
                                        setFormCpu('');
                                        setFormRam('');
                                        setFormSsd('');
                                        setFormGraphics('');
                                        setFormBattery('');
                                        setFormWindowsVer('');
                                        setFormBatchCode('');
                                    }}
                                    style={{
                                        padding: '8px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--profile-card-border)',
                                        background: 'transparent',
                                        color: 'var(--profile-text-main)',
                                        fontWeight: '600',
                                        fontSize: '12.5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="save-btn" 
                                    style={{ margin: 0, padding: '8px 24px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    disabled={saveEditLoading}
                                >
                                    {saveEditLoading && <Loader2 size={14} className="animate-spin" />} Upload Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
