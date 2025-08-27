import { useState } from 'react';
import './app.css';


export default function App() {
  const [url, setUrl] = useState('');
  const [redirects, setRedirects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
     * @param {string} startUrl The URL to begin the trace from.
   */
  const traceRedirects = async (startUrl) => {
    // Reset state for a new search
    setRedirects([]);
    setError(null);
    setIsLoading(true);

    try {
      let currentUrl = startUrl.trim();
      const trace = [];
      let maxRedirects = 10;

      while (maxRedirects > 0) {

        if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
          currentUrl = 'https://' + currentUrl;
        }

        trace.push({ url: currentUrl, status: '...' });
        setRedirects([...trace]);

        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
        });

        // Update the status for the current step
        const lastStep = trace[trace.length - 1];
        lastStep.status = response.status;
        setRedirects([...trace]);

        // Check if the status is a redirect (301, 302, 303, 307, 308)
        if (response.status >= 300 && response.status < 400) {
          const newUrl = response.headers.get('Location');
          if (newUrl) {
            // Check for relative paths and resolve them
            const newAbsoluteUrl = new URL(newUrl, currentUrl).href;
            currentUrl = newAbsoluteUrl;
            maxRedirects--;
          } else {
            // Redirect without a Location header, stop tracing
            break;
          }
        } else {
          // No more redirects, we've found the final destination
          break;
        }
      }
    } catch (err) {
      console.error("Error tracing redirects:", err);
      setError('Failed to trace URL. Please check the URL and your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the form submission event.
   * @param {object} e 
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      traceRedirects(url);
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        {/* Header */}
        <h1 className="header-h1">
          Wheregoes
        </h1>
        <p className="header-p">
          A Simple URL Redirect Trace
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="form-container">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL (e.g., google.com)"
            required
            className="input-field"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`submit-button ${isLoading ? 'submit-button-loading' : ''}`}
          >
            {isLoading ? 'Tracing...' : 'Trace Redirects'}
          </button>
        </form>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Tracing redirects...</span>
          </div>
        )}
        {error && (
          <div className="error-container">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {!isLoading && redirects.length > 0 && (
          <div className="results-container">
            <h2 className="results-h2">
              Redirect Link
            </h2>
            <div className="timeline">
              {redirects.map((step, index) => {
                const isFinal = index === redirects.length - 1;
                return (
                  <div key={index} className={`timeline-step ${isFinal ? 'timeline-step-final' : ''}`}>
                    {/* Step icon and line */}
                    <div className={`step-icon ${isFinal ? 'step-icon-final' : 'step-icon-redirect'}`}></div>

                    {/* Step content */}
                    <div className="step-content">
                      <span className={`status-badge ${isFinal ? 'status-badge-final' : 'status-badge-redirect'}`}>
                        {step.status}
                      </span>
                      <span className="status-label">
                        {isFinal ? 'Final Destination' : 'Redirect'}
                      </span>
                    </div>
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="url-link"
                    >
                      {step.url}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}