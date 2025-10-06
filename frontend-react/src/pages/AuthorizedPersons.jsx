import React from 'react';
import Layout from '../components/Layout';
import { Users, Plus, Search } from 'lucide-react';

const AuthorizedPersons = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Authorized Persons</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage authorized personnel database</p>
          </div>
          <button className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Person
          </button>
        </div>

        {/* Search Bar */}
        <div className="card mb-6">
          <div className="flex items-center">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              className="input flex-1"
            />
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="card text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Authorized Persons Management
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This page will display all authorized persons with their face encodings
          </p>
          <p className="text-sm text-gray-400">
            Coming soon: Add, edit, and manage authorized personnel
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AuthorizedPersons;
