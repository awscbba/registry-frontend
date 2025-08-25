import React, { useState, useEffect } from 'react';
import { getComponentLogger } from '../../utils/logger';
import type { Recommendation, QueryOptimizationPanelProps } from '../../types/database';
import databaseService, { DatabaseService } from '../../services/databaseService';

const QueryOptimizationPanel: React.FC<QueryOptimizationPanelProps> = ({
  showRecommendations = true,
  allowOptimizationApplication = true,
  maxRecommendations = 10
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingOptimization, setApplyingOptimization] = useState<string | null>(null);
  const [, setAppliedOptimizations] = useState<Set<string>>(new Set());

  // Fetch optimization recommendations
  const fetchRecommendations = async () => {
    try {
      setError(null);
      const data = await databaseService.getRecommendations();
      setRecommendations(data.slice(0, maxRecommendations));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      logger.error('Recommendations error', { error: err.message }, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showRecommendations) {
      fetchRecommendations();
    }
  }, [showRecommendations, maxRecommendations]);

  // Apply optimization recommendation
  const handleApplyOptimization = async (recommendationId: string) => {
    if (!allowOptimizationApplication) {
      return;
    }

    setApplyingOptimization(recommendationId);
    
    try {
      const result = await databaseService.applyRecommendation(recommendationId);
      
      if (result.success) {
        setAppliedOptimizations(prev => new Set([...prev, recommendationId]));
        // Update the recommendation status
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, applied: true, appliedAt: new Date().toISOString() }
              : rec
          )
        );
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply optimization');
    } finally {
      setApplyingOptimization(null);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'query':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'connection':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      case 'index':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'schema':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>Error loading optimization recommendations: {error}</p>
          <button 
            onClick={fetchRecommendations}
            className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Query Optimization Recommendations
          </h3>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg 
              className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">All Optimized!</h4>
            <p className="text-sm text-gray-600">No optimization recommendations available at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`border rounded-lg p-4 ${
                  recommendation.applied ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Priority Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(recommendation.priority)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(recommendation.type)}
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {recommendation.type}
                          </span>
                        </div>
                        <span 
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`}
                          style={{ 
                            backgroundColor: DatabaseService.getPriorityColor(recommendation.priority) + '20',
                            color: DatabaseService.getPriorityColor(recommendation.priority)
                          }}
                        >
                          {recommendation.priority} priority
                        </span>
                        {recommendation.applied && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Applied
                          </span>
                        )}
                      </div>

                      {/* Title and Description */}
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {recommendation.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {recommendation.description}
                      </p>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Expected Impact:</span>
                          <div className="text-gray-900">{recommendation.expectedImpact}</div>
                        </div>
                        <div>
                          <span className="font-medium">Implementation:</span>
                          <div className="text-gray-900">{recommendation.implementationEffort}</div>
                        </div>
                        <div>
                          <span className="font-medium">Time to Implement:</span>
                          <div className="text-gray-900">{recommendation.estimatedTimeToImplement}</div>
                        </div>
                        <div>
                          <span className="font-medium">Performance Gain:</span>
                          <div className="text-green-600 font-semibold">
                            +{recommendation.potentialPerformanceGain}%
                          </div>
                        </div>
                      </div>

                      {/* Applied timestamp */}
                      {recommendation.applied && recommendation.appliedAt && (
                        <div className="mt-2 text-xs text-green-600">
                          Applied on {new Date(recommendation.appliedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {allowOptimizationApplication && !recommendation.applied && (
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleApplyOptimization(recommendation.id)}
                        disabled={applyingOptimization === recommendation.id}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {applyingOptimization === recommendation.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Applying...
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Apply
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {recommendations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {recommendations.length}
                </div>
                <div className="text-sm text-gray-600">Total Recommendations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.applied).length}
                </div>
                <div className="text-sm text-gray-600">Applied</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.priority === 'critical').length}
                </div>
                <div className="text-sm text-gray-600">Critical Priority</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(recommendations.reduce((sum, r) => sum + r.potentialPerformanceGain, 0) / recommendations.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg Performance Gain</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Warning: {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryOptimizationPanel;
