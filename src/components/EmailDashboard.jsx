import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from './../components/ui/button';
import { useToast } from './../components/ui/use-toast';
import { Checkbox } from './../components/ui/checkbox';
import { supabase } from '../lib/supabaseClient';

const EmailDashboard = ({ csvData, emailTemplate }) => {
  const { toast } = useToast();
  const [emailStatuses, setEmailStatuses] = useState(
    csvData.map(() => ({ status: 'pending', message: '' }))
  );
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const replacePlaceholders = (text, row) => {
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

  const sendEmail = async (row, index) => {
    const subject = replacePlaceholders(emailTemplate.subject, row);
    const body = replacePlaceholders(emailTemplate.body, row);
    const to = row['Email Address'];

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: JSON.stringify({
          to,
          subject,
          body
        })
      });

      if (error) throw error;
      
      // Handle logical errors returned with 200 OK status
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setEmailStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = { status: 'sent', message: 'Email sent successfully' };
        return newStatuses;
      });

      return { success: true };
    } catch (error) {
      console.error('Send error:', error);
      
      setEmailStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = { status: 'failed', message: error.message };
        return newStatuses;
      });

      return { success: false, error: error.message };
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a test email address'
      });
      return;
    }

    setIsSending(true);
    const testRow = { ...csvData[0], 'Email Address': testEmail };
    const subject = replacePlaceholders(emailTemplate.subject, testRow);
    const body = replacePlaceholders(emailTemplate.body, testRow);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: JSON.stringify({
          to: testEmail,
          subject,
          body
        })
      });

      if (error) throw error;
      
      // Handle logical errors returned with 200 OK status
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: 'Test Email Sent',
        description: `Test email sent to ${testEmail}`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send',
        description: error.message
      });
      
      if (error.message.includes('API Key') || error.message.includes('SMTP_PASS')) {
        toast({
          variant: 'destructive',
          title: 'Configuration Error',
          description: 'Please check your SMTP_PASS secret. It should be a valid SMTP2GO API Key starting with "api-".'
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSelected = async () => {
    if (selectedRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select at least one row to send emails'
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const index of selectedRows) {
      const result = await sendEmail(csvData[index], index);
      if (result.success) successCount++;
      else failCount++;
      
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsSending(false);
    toast({
      title: 'Batch Complete',
      description: `Sent: ${successCount}, Failed: ${failCount}`
    });
  };

  const handleSendAll = async () => {
    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const result = await sendEmail(csvData[i], i);
      if (result.success) successCount++;
      else failCount++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsSending(false);
    toast({
      title: 'All Emails Processed',
      description: `Sent: ${successCount}, Failed: ${failCount}`
    });
  };

  const toggleRowSelection = (index) => {
    setSelectedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === csvData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(csvData.map((_, i) => i));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const sentCount = emailStatuses.filter(s => s.status === 'sent').length;
  const failedCount = emailStatuses.filter(s => s.status === 'failed').length;
  const pendingCount = emailStatuses.filter(s => s.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Email Sending Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-semibold">Sent</p>
              <p className="text-3xl font-bold text-green-900">{sentCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-semibold">Failed</p>
              <p className="text-3xl font-bold text-red-900">{failedCount}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 font-semibold">Pending</p>
              <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
            </div>
            <Clock className="w-10 h-10 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Send Test Email</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter test email address..."
            className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button onClick={handleSendTest} disabled={isSending}>
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Test
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Button 
          onClick={handleSendSelected} 
          disabled={isSending || selectedRows.length === 0}
          className="flex-1"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Selected ({selectedRows.length})
        </Button>
        <Button 
          onClick={handleSendAll} 
          disabled={isSending}
          variant="default"
          className="flex-1"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send All Rows
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={selectedRows.length === csvData.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Company</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Message</th>
            </tr>
          </thead>
          <tbody>
            {csvData.map((row, index) => (
              <tr key={index} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedRows.includes(index)}
                    onCheckedChange={() => toggleRowSelection(index)}
                  />
                </td>
                <td className="px-4 py-3">
                  {getStatusIcon(emailStatuses[index].status)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {row['First Name']} {row['Last Name']}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {row['Email Address']}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {row['Company Name']}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {emailStatuses[index].message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default EmailDashboard;