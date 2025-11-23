'use client';

import Link from 'next/link';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          Accessibility Statement
        </h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">
              Our Commitment
            </h2>
            <p className="mb-3">
              We are committed to ensuring digital accessibility for people of all abilities. 
              We continually work to improve the accessibility of our ordering system to ensure 
              it provides an inclusive experience for all users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">
              Accessibility Features
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Keyboard Navigation:</strong> All interactive elements can be accessed 
                and operated using only a keyboard. Use Tab to move forward, Shift+Tab to move 
                backward, and Enter or Space to activate elements.
              </li>
              <li>
                <strong>Screen Reader Support:</strong> We provide ARIA labels, roles, and live 
                regions to ensure compatibility with screen readers like NVDA, JAWS, and VoiceOver.
              </li>
              <li>
                <strong>High Contrast Mode:</strong> Enable high contrast themes for improved 
                text readability. Access this setting from the accessibility menu.
              </li>
              <li>
                <strong>Visible Focus Indicators:</strong> Clear focus rings show which element 
                is currently selected during keyboard navigation.
              </li>
              <li>
                <strong>Font Scaling:</strong> Text can be resized up to 200% without loss of 
                content or functionality. Use your browser&apos;s zoom feature or adjust settings in 
                the accessibility menu.
              </li>
              <li>
                <strong>Reduced Motion:</strong> Animations and transitions can be reduced or 
                disabled for users sensitive to motion. This respects your system preferences 
                and can be toggled in the accessibility menu.
              </li>
              <li>
                <strong>Live Order Updates:</strong> Screen readers announce order changes and 
                important updates in real-time.
              </li>
              <li>
                <strong>Descriptive Error Messages:</strong> Form validation errors provide 
                clear, actionable guidance for correction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">
              Conformance Status
            </h2>
            <p className="mb-3">
              We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 
              Level AA standards. These guidelines explain how to make web content more 
              accessible for people with disabilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">
              Keyboard Shortcuts
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Tab</kbd> - Navigate forward through interactive elements</li>
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-gray-200 rounded">Tab</kbd> - Navigate backward</li>
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-gray-200 rounded">Space</kbd> - Activate buttons and links</li>
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd> - Close dialogs and modals</li>
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Arrow Keys</kbd> - Navigate within menus and lists</li>
            </ul>
          </section>

          <div className="mt-8">
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

