import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, Download, Loader2 } from 'lucide-react';
import { createInvoice } from '../api/client';

export default function BulkImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleSampleDownload = () => {
    const sampleCsv = `Invoice ID,Customer Name,Customer Email,Amount,Due Date
INV-2026-901,Apex Logistics Pvt Ltd,billing@apexlogistics.in,45000,2026-08-30
INV-2026-902,Zenith Retail Networks,accounts@zenithretail.com,120000,2026-08-25
INV-2026-903,HyperScale Cloud India,finance@hyperscale.tech,85000,2026-08-20
INV-2026-904,BlueWave Manufacturing,purchase@bluewave.com,34000,2026-08-15`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'smartinvoice_sample_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          throw new Error('CSV must contain header row and at least 1 invoice row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 4) {
            rows.push({
              id: cols[0] || `INV-CSV-${Date.now()}-${i}`,
              customer_name: cols[1] || 'Customer ' + i,
              customer_email: cols[2] || 'finance@customer.com',
              amount: parseFloat(cols[3]) || 5000,
              due_date: cols[4] || new Date().toISOString().split('T')[0]
            });
          }
        }

        if (rows.length === 0) {
          throw new Error('No valid invoice rows found in uploaded file');
        }

        setParsedRows(rows);
      } catch (err) {
        setError(err.message);
        setParsedRows([]);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    let successCount = 0;
    for (let i = 0; i < parsedRows.length; i++) {
      try {
        await createInvoice(parsedRows[i]);
        successCount++;
      } catch (err) {
        console.warn('Failed to import row', parsedRows[i], err);
      }
      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    setIsProcessing(false);
    if (onSuccess) {
      onSuccess(successCount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 relative space-y-6 animate-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk CSV Invoice Ingestion</h2>
            <p className="text-xs text-gray-500">Import QuickBooks, Zoho, or Excel invoices into SmartInvoice.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/20 transition cursor-pointer relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-800">Click or drag CSV file here to upload</h4>
            <p className="text-xs text-gray-400 mt-1">Accepts standard .csv files with headers (ID, Name, Email, Amount, Due Date)</p>
          </div>
        )}

        {/* File Preview */}
        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-400">{parsedRows.length} valid invoice records identified</div>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setParsedRows([]); }}
                disabled={isProcessing}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Change File
              </button>
            </div>

            {/* Preview table previewing first 3 rows */}
            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 sticky top-0">
                  <tr>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Client</th>
                    <th className="p-2.5">Amount</th>
                    <th className="p-2.5">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2.5 font-mono font-medium text-indigo-600">{row.id}</td>
                      <td className="p-2.5 text-gray-700">{row.customer_name}</td>
                      <td className="p-2.5 font-bold text-gray-900">${row.amount.toLocaleString()}</td>
                      <td className="p-2.5 text-gray-500">{row.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Importing invoices to database...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSampleDownload}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download Sample CSV
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={parsedRows.length === 0 || isProcessing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-sm shadow-indigo-200 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Ingesting...
                </>
              ) : (
                `Import ${parsedRows.length} Invoices`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
