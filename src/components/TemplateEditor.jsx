import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';

const TemplateEditor = ({ csvData, emailTemplate, setEmailTemplate, onNext }) => {
  const { toast } = useToast();
  const [selectedRow, setSelectedRow] = useState(0);

  const placeholders = [
    '{{First Name}}',
    '{{Last Name}}',
    '{{Position}}',
    '{{Company Name}}',
    '{{LinkedIn Profile Link}}',
    '{{Company Website Link}}',
    '{{Email Address}}'
  ];

  const replacePlaceholders = (text, row) => {
    if (!row) return text;
    let result = text || '';
    result = result.replace(/\{\{First Name\}\}/g, row['First Name'] || '');
    result = result.replace(/\{\{Last Name\}\}/g, row['Last Name'] || '');
    result = result.replace(/\{\{Position\}\}/g, row['Position'] || '');
    result = result.replace(/\{\{Company Name\}\}/g, row['Company Name'] || '');
    result = result.replace(/\{\{LinkedIn Profile Link\}\}/g, row['LinkedIn Profile Link'] || '');
    result = result.replace(/\{\{Company Website Link\}\}/g, row['Company Website Link'] || '');
    result = result.replace(/\{\{Email Address\}\}/g, row['Email Address'] || '');
    return result;
  };

  const handleSave = () => {
    localStorage.setItem('emailTemplate', JSON.stringify(emailTemplate));
    toast({
      title: 'Template Saved',
      description: 'Your email template has been saved successfully'
    });
  };

  const handleChange = (field, value) => {
    setEmailTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const insertPlaceholder = (placeholder, field) => {
    const currentValue = emailTemplate[field] || '';
    handleChange(field, currentValue + placeholder);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Email Template</h2>
          
          <div className="mb-6">
            <Label htmlFor="subject" className="text-base font-semibold mb-2 block">
              Subject Line
            </Label>
            <input
              id="subject"
              type="text"
              value={emailTemplate.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter email subject..."
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="body" className="text-base font-semibold mb-2 block">
              Email Body
            </Label>
            <textarea
              id="body"
              value={emailTemplate.body}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter email body..."
            />
          </div>

          <div className="mb-6">
            <Label className="text-base font-semibold mb-3 block">Available Placeholders</Label>
            <div className="flex flex-wrap gap-2">
              {placeholders.map((placeholder) => (
                <Button
                  key={placeholder}
                  variant="outline"
                  size="sm"
                  onClick={() => insertPlaceholder(placeholder, 'body')}
                  className="text-xs"
                >
                  {placeholder}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} variant="outline" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={onNext} className="flex-1">
              Next: Send Emails
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Live Preview</h2>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-slate-600">Preview Row:</Label>
              <select
                value={selectedRow}
                onChange={(e) => setSelectedRow(Number(e.target.value))}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
              >
                {csvData.map((_, index) => (
                  <option key={index} value={index}>
                    Row {index + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 sticky top-6">
            <div className="mb-4">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Subject:</Label>
              <div className="bg-white p-3 rounded border border-slate-200 text-slate-900 min-h-[42px]">
                {replacePlaceholders(emailTemplate.subject, csvData[selectedRow]) || (
                  <span className="text-slate-400 italic">Subject preview...</span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Body:</Label>
              <div className="bg-white p-4 rounded border border-slate-200 min-h-[300px] whitespace-pre-wrap text-slate-900">
                {replacePlaceholders(emailTemplate.body, csvData[selectedRow]) || (
                  <span className="text-slate-400 italic">Email body preview...</span>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Preview Data</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Recipient: {csvData[selectedRow]?.['Email Address'] || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TemplateEditor;