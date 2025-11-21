import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { motion } from 'framer-motion';

const CsvUpload = ({ csvData, setCsvData }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [page, setPage] = useState(0); // ✅ pagination state
  const fileInputRef = useRef(null);   // ✅ ref for file input

  const PAGE_SIZE = 50;

  const parseCsv = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must contain headers and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleFileUpload = useCallback((file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload a CSV file'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCsv(text);
        setCsvData(parsed);
        setPage(0); // ✅ reset to first page on new upload
        toast({
          title: 'Success',
          description: `Loaded ${parsed.length} rows from CSV`
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Parse Error',
          description: error.message
        });
      }
    };
    reader.readAsText(file);
  }, [setCsvData, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
    // reset input so uploading the same file again still triggers onChange
    e.target.value = '';
  };

  const clearData = () => {
    setCsvData([]);
    setPage(0);
    toast({
      title: 'Cleared',
      description: 'CSV data has been cleared'
    });
  };

  // ✅ Pagination calculations
  const totalRows = csvData.length;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);
  const startIndex = page * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalRows);
  const currentPageRows = csvData.slice(startIndex, endIndex);

  // Simple array of page numbers: [0, 1, 2, ...]
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      {csvData.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold mb-2 text-slate-900">Upload CSV File</h3>
          <p className="text-slate-600 mb-6">
            Drag and drop your CSV file here, or click the button below
          </p>

          {/* ✅ Hidden file input + button trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Choose File
          </Button>

          <div className="mt-8 text-left bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Expected CSV Columns:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• NO.</li>
              <li>• First Name</li>
              <li>• Last Name</li>
              <li>• Position</li>
              <li>• LinkedIn Profile Link</li>
              <li>• Email Address</li>
              <li>• Company Name</li>
              <li>• Company Email Address</li>
              <li>• Company Website Link</li>
              <li>• Name</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900">CSV Loaded</h3>
                <p className="text-slate-600">
                  {totalRows} rows imported
                </p>
              </div>
            </div>
           <Button
  onClick={clearData}
  className="bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-sm"
>
  <X className="w-4 h-4 mr-2" />
  Clear Data
</Button>

          </div>

          {/* Table area */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {Object.keys(csvData[0]).map((header) => (
                    <th
                      key={header}
                      className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPageRows.map((row, index) => (
                  <tr
                    key={startIndex + index}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {Object.values(row).map((value, i) => (
                      <td
                        key={i}
                        className="border border-slate-300 px-4 py-2 text-sm text-slate-600"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls under table */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold">{startIndex + 1}</span> –
              <span className="font-semibold"> {endIndex}</span> of{' '}
              <span className="font-semibold">{totalRows}</span> rows
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Previous */}
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-600"
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`
                      px-3 py-1 rounded-md text-sm font-medium transition-all
                      ${
                        p === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-slate-400 text-slate-800 hover:bg-slate-200'
                      }
                    `}
                  >
                    {p + 1}
                  </button>
                ))}

                {/* Next */}
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-600"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CsvUpload;
