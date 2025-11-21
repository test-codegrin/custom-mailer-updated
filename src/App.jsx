import React, { useState } from 'react';
import { Helmet } from 'react-helmet';

import TemplateEditor from './components/TemplateEditor';
import EmailDashboard from './components/EmailDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import CsvUpload from './components/CsvUpload';
import { ToastProvider } from '@radix-ui/react-toast';
import { Toaster } from './components/ui/toaster';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  
  // Initialize from localStorage so the tab is enabled if data exists
  const [emailTemplate, setEmailTemplate] = useState(() => {
    const saved = localStorage.getItem('emailTemplate');
    try {
      return saved ? JSON.parse(saved) : { subject: '', body: '' };
    } catch (e) {
      return { subject: '', body: '' };
    }
  });

  // Check if we have everything needed to enable the Send tab
  const isSendEnabled =
    csvData.length > 0 &&
    emailTemplate.subject &&
    emailTemplate.subject.trim() !== '' &&
    emailTemplate.body &&
    emailTemplate.body.trim() !== '';

  return (
    <>
      <Helmet>
        <title>CSV Email Sender - Bulk Email Campaign Tool</title>
        <meta
          name="description"
          content="Send personalized bulk emails using CSV data with custom templates and real-time tracking"
        />
      </Helmet>
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                CSV Email Sender
              </h1>
              <p className="text-slate-600">
                Upload CSV, create templates, and send personalized emails
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="upload">1. Upload CSV</TabsTrigger>
                <TabsTrigger value="template" disabled={csvData.length === 0}>
                  2. Create Template
                </TabsTrigger>
                <TabsTrigger value="send" disabled={!isSendEnabled}>
                  3. Send Emails
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <CsvUpload
                  csvData={csvData}
                  setCsvData={setCsvData}
                  // ✅ Auto-redirect to Template tab after successful CSV upload
                  onNext={() => setActiveTab('template')}
                />
              </TabsContent>

              <TabsContent value="template">
                <TemplateEditor
                  csvData={csvData}
                  emailTemplate={emailTemplate}
                  setEmailTemplate={setEmailTemplate}
                  onNext={() => setActiveTab('send')}
                />
              </TabsContent>

              <TabsContent value="send">
                <EmailDashboard csvData={csvData} emailTemplate={emailTemplate} />
              </TabsContent>
            </Tabs>
          </div>
          <Toaster />
        </div>
      </ToastProvider>
    </>
  );
}

export default App;
