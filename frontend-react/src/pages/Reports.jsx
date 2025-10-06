import React from 'react';
import Layout from '../components/Layout';
import { FileText, Download } from 'lucide-react';

const Reports = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reports</h2>
            <p className="text-gray-600 dark:text-gray-400">Generate and export security reports</p>
          </div>
          <button className="btn-primary flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Security Reports
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Generate daily, weekly, and monthly security reports
          </p>
          <p className="text-sm text-gray-400">
            Coming soon: PDF reports, analytics, and data export
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
