import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {formatDate(currentTime)}
        </span>
      </div>
    </div>
  );
};

export default LiveClock;
