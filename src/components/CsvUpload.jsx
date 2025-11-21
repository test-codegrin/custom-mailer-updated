import React, { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const CsvUpload = ({ csvData, setCsvData }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

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

    if (!file.name.endsWith('.csv')) {
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
  };

  const clearData = () => {
    setCsvData([]);
    toast({
      title: 'Cleared',
      description: 'CSV data has been cleared'
    });
  };

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
            Drag and drop your CSV file here, or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button asChild>
              <span>Choose File</span>
            </Button>
          </label>
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
                <p className="text-slate-600">{csvData.length} rows imported</p>
              </div>
            </div>
            <Button variant="destructive" onClick={clearData}>
              <X className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {Object.keys(csvData[0]).map((header) => (
                    <th key={header} className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="border border-slate-300 px-4 py-2 text-sm text-slate-600">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && (
              <p className="text-sm text-slate-500 mt-4 text-center">
                Showing 5 of {csvData.length} rows
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CsvUpload;