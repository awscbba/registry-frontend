import React, { useState } from 'react';
import performanceService from '../../services/performanceService';

const PerformanceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Running test: ${testName}`);
      const result = await testFunction();
      setTestResults((prev: any) => ({
        ...prev,
        [testName]: { success: true, data: result, timestamp: new Date().toISOString() }
      }));
      console.log(`✅ ${testName} passed:`, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTestResults((prev: any) => ({
        ...prev,
        [testName]: { success: false, error: errorMessage, timestamp: new Date().toISOString() }
      }));
      console.error(`❌ ${testName} failed:`, err);
      setError(`${testName}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Performance Metrics',
      description: 'Test /admin/performance/metrics endpoint',
      test: () => performanceService.getMetrics()
    },
    {
      name: 'Cache Stats',
      description: 'Test /admin/performance/cache/stats endpoint',
      test: () => performanceService.getCacheStats()
    },
    {
      name: 'Health Status',
      description: 'Test /admin/performance/health endpoint',
      test: () => performanceService.getHealthStatus()
    },
    {
      name: 'Slowest Endpoints',
      description: 'Test /admin/performance/slowest-endpoints endpoint',
      test: () => performanceService.getSlowestEndpoints()
    },
    {
      name: 'Analytics',
      description: 'Test /admin/performance/analytics endpoint',
      test: () => performanceService.getAnalytics()
    },
    {
      name: 'Cache Health',
      description: 'Test /admin/performance/cache/health endpoint',
      test: () => performanceService.getCacheHealth()
    },
    {
      name: 'Performance History',
      description: 'Test performance history endpoint',
      test: () => performanceService.getPerformanceHistory('1h')
    }
  ];

  const runAllTests = async () => {
    setTestResults({});
    for (const test of tests) {
      await runTest(test.name, test.test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const testCacheClear = async () => {
    await runTest('Clear Cache', () => performanceService.clearCache());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Performance API Test Suite
        </h1>
        <p className="text-gray-600 mb-6">
          Test all performance optimization endpoints to verify frontend-backend integration.
        </p>

        {/* Test Controls */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </button>

          <button
            onClick={testCacheClear}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Test Cache Clear
          </button>

          <button
            onClick={() => setTestResults({})}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Results
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Test Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Individual Tests */}
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {testResults[test.name] && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      testResults[test.name].success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {testResults[test.name].success ? '✅ Passed' : '❌ Failed'}
                    </span>
                  )}
                  <button
                    onClick={() => runTest(test.name, test.test)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>
              </div>

              {/* Test Result */}
              {testResults[test.name] && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">
                    {testResults[test.name].timestamp}
                  </div>
                  {testResults[test.name].success ? (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <pre className="text-xs text-green-800 overflow-x-auto">
                        {JSON.stringify(testResults[test.name].data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">
                        {testResults[test.name].error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Summary */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Test Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(testResults).length}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(testResults).filter((r: any) => r.success).length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(testResults).filter((r: any) => !r.success).length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceTest;
