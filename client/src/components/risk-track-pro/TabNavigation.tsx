
import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { AlertTriangle, Calendar, FileSpreadsheet, LineChart } from 'lucide-react';

interface TabNavigationProps {
  projectId: string;
  activeTab: 'risks' | 'issues' | 'critical-dates' | 'rating-legend';
}

const TabNavigation: React.FC<TabNavigationProps> = ({ projectId, activeTab }) => {
  const tabs = [
    {
      id: 'risks',
      label: 'Risk Register',
      icon: <AlertTriangle className="h-4 w-4 mr-2" />,
      href: `/projects/${projectId}/risks`,
    },
    {
      id: 'issues',
      label: 'Issues Register',
      icon: <FileSpreadsheet className="h-4 w-4 mr-2" />,
      href: `/projects/${projectId}/issues`,
    },
    {
      id: 'critical-dates',
      label: 'Critical Dates',
      icon: <Calendar className="h-4 w-4 mr-2" />,
      href: `/projects/${projectId}/critical-dates`,
    },
    {
      id: 'rating-legend',
      label: 'Rating Legend',
      icon: <LineChart className="h-4 w-4 mr-2" />,
      href: `/projects/${projectId}/rating-legend`,
    },
  ];

  return (
    <div className="border-b mb-6">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.href}
            className={cn(
              'flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-gray-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;
