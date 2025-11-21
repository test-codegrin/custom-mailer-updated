import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';

const MAX_TEMPLATES = 10;

const TemplateEditor = ({ csvData, emailTemplate, setEmailTemplate, onNext }) => {
  const { toast } = useToast();
  const [selectedRow, setSelectedRow] = useState(0);

  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');

  const placeholders = [
    '{{First Name}}',
    '{{Last Name}}',
    '{{Position}}',
    '{{Company Name}}',
    '{{LinkedIn Profile Link}}',
    '{{Company Website Link}}',
    '{{Email Address}}'
  ];

  // Load saved templates from localStorage on mount
  useEffect(() => {
    try {
      const listRaw = localStorage.getItem('emailTemplateList');
      const singleRaw = localStorage.getItem('emailTemplate');

      let list = [];
      if (listRaw) {
        list = JSON.parse(listRaw) || [];
      }

      // Backwards compatibility: if we only had a single saved template before
      if (!list.length && singleRaw) {
        const single = JSON.parse(singleRaw);
        if (single && (single.subject || single.body)) {
          const defaultTemplate = {
            id: 'default',
            name: 'Default Template',
            subject: single.subject || '',
            body: single.body || '',
            createdAt: new Date().toISOString()
          };
          list = [defaultTemplate];
          localStorage.setItem('emailTemplateList', JSON.stringify(list));
        }
      }

      setSavedTemplates(list);
      if (list.length > 0) {
        setSelectedTemplateId(list[0].id);
        setTemplateName(list[0].name);
      }
    } catch (e) {
      console.error('Failed to load templates from localStorage', e);
    }
  }, []);

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

  const handleSave = () => {
    const name = templateName.trim() || `Template ${savedTemplates.length + 1}`;
const existing = localStorage.getItem('emailTemplate');

  if (existing) {
    const parsed = JSON.parse(existing);

    if (parsed?.subject === emailTemplate.subject) {
      toast({
        title: 'Already Saved',
        description: 'This subject already exists in local storage.'
      });
      return;
    }
  }

    if (!emailTemplate.subject.trim() && !emailTemplate.body.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Save',
        description: 'Please add a subject or body before saving a template'
      });
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject: emailTemplate.subject || '',
      body: emailTemplate.body || '',
      createdAt: new Date().toISOString()
    };

    // Put newest first
    let newList = [newTemplate, ...savedTemplates];

    // Limit to 10 templates
    if (newList.length > MAX_TEMPLATES) {
      newList = newList.slice(0, MAX_TEMPLATES);
    }

    setSavedTemplates(newList);
    setSelectedTemplateId(newTemplate.id);

    // Save list + last used template for backward compatibility
    try {
      localStorage.setItem('emailTemplateList', JSON.stringify(newList));
      localStorage.setItem(
        'emailTemplate',
        JSON.stringify({
          subject: newTemplate.subject,
          body: newTemplate.body
        })
      );
    } catch (e) {
      console.error('Failed to save templates to localStorage', e);
    }

    toast({
      title: 'Template Saved',
      description: `Saved as "${name}" (${newList.length}/${MAX_TEMPLATES} slots used)`
    });
  };

  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id);
    const tpl = savedTemplates.find(t => t.id === id);
    if (!tpl) return;

    setEmailTemplate({
      subject: tpl.subject,
      body: tpl.body
    });
    setTemplateName(tpl.name);

    // Also store as last used
    try {
      localStorage.setItem(
        'emailTemplate',
        JSON.stringify({ subject: tpl.subject, body: tpl.body })
      );
    } catch (e) {
      console.error('Failed to update active template in localStorage', e);
    }

    toast({
      title: 'Template Loaded',
      description: `Loaded "${tpl.name}"`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT SIDE: Editor */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Email Template</h2>

          {/* Saved templates selector */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-2 block text-slate-900">
              Saved Templates
            </Label>
            <div className="flex gap-2 items-center">
              <select
                value={savedTemplates.length ? selectedTemplateId : ''}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                disabled={savedTemplates.length === 0}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                {savedTemplates.length === 0 ? (
                  <option value="">No saved templates</option>
                ) : (
                  savedTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))
                )}
              </select>
              {savedTemplates.length > 0 && (
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {savedTemplates.length}/{MAX_TEMPLATES}
                </span>
              )}
            </div>
          </div>

          {/* Template name */}
          <div className="mb-6">
            <Label
              htmlFor="templateName"
              className="text-base font-semibold mb-2 block text-slate-900"
            >
              Template Name (optional)
            </Label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg
                         text-slate-900 placeholder-slate-400
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              placeholder="e.g. Codegrin – Main Outreach Template"
            />
          </div>

          {/* Subject */}
          <div className="mb-6">
            <Label htmlFor="subject" className="text-base font-semibold mb-2 block text-slate-900">
              Subject Line
            </Label>
            <input
              id="subject"
              type="text"
              value={emailTemplate.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg 
                         text-slate-900 placeholder-slate-400 bg-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter email subject..."
            />
          </div>

          {/* Body */}
          <div className="mb-6">
            <Label htmlFor="body" className="text-base font-semibold mb-2 block text-slate-900">
              Email Body
            </Label>
            <textarea
              id="body"
              value={emailTemplate.body}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg 
                         text-slate-900 placeholder-slate-400 bg-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter email body (HTML or plain text)..."
            />
          </div>

          {/* Placeholders */}
          <div className="mb-6">
            <Label className="text-base font-semibold mb-3 block text-slate-900">
              Available Placeholders
            </Label>

            <div className="flex flex-wrap gap-2">
              {placeholders.map((placeholder) => (
                <Button
                  key={placeholder}
                  variant="outline"
                  size="sm"
                  onClick={() => insertPlaceholder(placeholder, 'body')}
                  className="text-xs text-slate-800 border-slate-300 hover:bg-slate-100 bg-white"
                >
                  {placeholder}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              variant="outline"
              className="flex-1 text-slate-900 border-slate-300 hover:bg-slate-100 bg-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>

            <Button
              onClick={onNext}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              Next: Send Emails
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE: Preview */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Live Preview</h2>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-slate-600">Preview Row:</Label>
              <select
                value={selectedRow}
                onChange={(e) => setSelectedRow(Number(e.target.value))}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
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
            {/* SUBJECT PREVIEW */}
            <div className="mb-4">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Subject:
              </Label>
              <div className="bg-white p-3 rounded border border-slate-200 text-slate-900 min-h-[42px]">
                {replacePlaceholders(emailTemplate.subject, csvData[selectedRow]) || (
                  <span className="text-slate-400 italic">Subject preview...</span>
                )}
              </div>
            </div>

            {/* BODY PREVIEW */}
            <div className="mb-4">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Body:
              </Label>

              {(() => {
                const previewHtml =
                  replacePlaceholders(
                    emailTemplate.body || '',
                    csvData[selectedRow] || {}
                  ) || '';

                return previewHtml.trim() ? (
                  <iframe
                    title="Email body preview"
                    className="w-full h-[500px] bg-white border border-slate-200 rounded"
                    srcDoc={previewHtml}
                  />
                ) : (
                  <div className="bg-white p-4 rounded border border-slate-200 min-h-[200px] flex items-center justify-center">
                    <span className="text-slate-400 italic">Email body preview...</span>
                  </div>
                );
              })()}
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
