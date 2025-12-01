'use client';

import { useState } from 'react';
import LanguageSelector from '@/app/components/LanguageSelector';
import { useTranslation, useTranslatedTexts } from '@/app/hooks/useTranslation';

import { useToast } from '@/app/hooks/useToast';

export default function TranslationTestPage() {
  const { currentLanguage, supportedLanguages, translate } = useTranslation();
  const [testText, setTestText] = useState('Hello');
  const [manualResult, setManualResult] = useState('');
  const [testing, setTesting] = useState(false);
  const { addToast } = useToast();

  // Test automatic translation with the hook
  const textsToTranslate = [
    'Welcome to our restaurant',
    'Your order',
    'Total price',
    'Thank you',
  ];
  
  const { translatedTexts, isTranslating } = useTranslatedTexts(textsToTranslate);

  const handleManualTest = async () => {
    setTesting(true);
    try {
      const result = await translate(testText);
      setManualResult(result);
    } catch (error) {
      console.error('Manual test error:', error);
      setManualResult('Error: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const testApiDirectly = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    console.log('Testing API at:', apiUrl);
    
    try {
      // Test 1: Check if backend is reachable
      const healthResponse = await fetch(`${apiUrl}/health`);
      console.log('Health check:', healthResponse.ok ? '✅' : '❌', await healthResponse.text());

      // Test 2: Get languages
      const langResponse = await fetch(`${apiUrl}/api/translation/languages`);
      const langData = await langResponse.json();
      console.log('Languages endpoint:', langResponse.ok ? '✅' : '❌', langData);

      // Test 3: Translate
      const translateResponse = await fetch(`${apiUrl}/api/translation/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          targetLanguage: 'es',
          sourceLanguage: 'en',
        }),
      });
      const translateData = await translateResponse.json();
      console.log('Translate endpoint:', translateResponse.ok ? '✅' : '❌', translateData);

      addToast({ message: 'API tests complete! Check console for details.', type: 'success' });
    } catch (error) {
      console.error('API test failed:', error);
      addToast({ message: 'API test failed! Check console for details.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Translation System Test Page</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Language: {currentLanguage}</h2>
            <LanguageSelector showLabel={true} />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">System Info</h2>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm space-y-1">
              <div>API URL: {process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}</div>
              <div>Supported Languages Loaded: {supportedLanguages.length}</div>
              <div>Current Language: {currentLanguage}</div>
              <div>Is Translating: {isTranslating ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={testApiDirectly}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Test API Directly (Check Console)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Automatic Translation Test</h2>
          <p className="text-gray-600 mb-4">
            These texts should automatically translate when you change the language:
          </p>
          
          <div className="space-y-3">
            {textsToTranslate.map((original, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Original: {original}</div>
                <div className="text-lg font-medium text-blue-600">
                  Translated: {translatedTexts[index] || original}
                </div>
              </div>
            ))}
          </div>

          {isTranslating && (
            <div className="mt-4 text-blue-600">
              🔄 Translating...
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Manual Translation Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter text to translate:
              </label>
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Enter text..."
              />
            </div>

            <button
              onClick={handleManualTest}
              disabled={testing}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {testing ? 'Translating...' : 'Translate'}
            </button>

            {manualResult && (
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-gray-600">Original: {testText}</div>
                <div className="text-sm text-gray-600">Target: {currentLanguage}</div>
                <div className="text-lg font-medium text-green-700">
                  Result: {manualResult}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">Debug Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open your browser&apos;s Developer Console (F12 or Cmd+Option+I)</li>
            <li>Look for [Translation] log messages</li>
            <li>Change the language using the selector above</li>
            <li>Watch the console for translation activity</li>
            <li>Click &ldquo;Test API Directly&rdquo; to verify backend connectivity</li>
            <li>Check if the automatic translations update</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

