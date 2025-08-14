import React from 'react';
import type { HealthStatus } from '../../types/performance';
import { PerformanceService } from '../../services/performanceService';

interface SystemHealthOverviewProps {
  healthStatus: HealthStatus;
  compactView?: boolean;
}

const SystemHealthOverview: React.FC<SystemHealthOverviewProps> = ({
  healthStatus,
  compactView = false
}) => {
  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) {
      return 'text-green-600';
    }
    if (score >= 70) {
      return 'text-blue-600';
    }
    if (score >= 50) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getHealthScoreBackground = (score: number): string => {
    if (score >= 90) {
      return 'bg-green-100';
    }
    if (score >= 70) {
      return 'bg-blue-100';
    }
    if (score >= 50) {
      return 'bg-yellow-100';
    }
    return 'bg-red-100';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cache':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      case 'database':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (uptimeSeconds: number): string => {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            System Health Overview
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              healthStatus.status === 'healthy' ? 'bg-green-100 text-green-800' :
              healthStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {PerformanceService.getHealthStatusBadge(healthStatus.status).text}
            </div>
          </div>
        </div>

        {/* Health Score Display */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getHealthScoreBackground(healthStatus.score)}`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getHealthScoreColor(healthStatus.score)}`}>
                  {healthStatus.score}
                </div>
                <div className="text-xs text-gray-600">Health Score</div>
              </div>
            </div>
            {/* Health Score Ring */}
            <svg className="absolute top-0 left-0 w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthStatus.score / 100)}`}
                className={getHealthScoreColor(healthStatus.score)}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* System Uptime */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600">System Uptime</div>
          <div className="text-lg font-medium text-gray-900">
            {formatUptime(healthStatus.uptime)}
          </div>
        </div>

        {/* Health Issues */}
        {healthStatus.issues && healthStatus.issues.length > 0 && (
          <div className={compactView ? 'space-y-2' : 'space-y-3'}>
            <h4 className="text-md font-medium text-gray-900">
              Health Issues ({healthStatus.issues.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {healthStatus.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    issue.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    issue.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                    issue.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className={`flex-shrink-0 p-1 rounded ${getSeverityColor(issue.severity)}`}>
                    {getIssueIcon(issue.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {issue.type} Issue
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {issue.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(issue.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Issues State */}
        {(!healthStatus.issues || healthStatus.issues.length === 0) && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">All Systems Operational</h4>
            <p className="text-sm text-gray-600">No health issues detected</p>
          </div>
        )}

        {/* Health Metrics Summary */}
        {!compactView && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {healthStatus.issues ? healthStatus.issues.filter(i => i.severity === 'critical').length : 0}
                </div>
                <div className="text-sm text-red-600">Critical Issues</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {healthStatus.issues ? healthStatus.issues.filter(i => i.severity === 'high').length : 0}
                </div>
                <div className="text-sm text-orange-600">High Priority</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthOverview;
