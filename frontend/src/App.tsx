import React, { useState, useEffect } from 'react'
import {
  analyzeText,
  getHistory,
  getHealth
} from './api/client'
import type {
  AnalyzeResponse,
  AnalysisHistoryItem
} from './api/client'

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'about'>('home')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([])
  const [historyCount, setHistoryCount] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // Initialize theme and health check
  useEffect(() => {
    // Sync dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    checkHealth()
    fetchHistory()
  }, [])

  const checkHealth = async () => {
    try {
      const res = await getHealth()
      if (res.status === 'healthy') {
        setIsBackendHealthy(true)
      } else {
        setIsBackendHealthy(false)
      }
    } catch (err) {
      setIsBackendHealthy(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await getHistory(30)
      setHistoryItems(res.items)
      setHistoryCount(res.total)
    } catch (err) {
      console.error('Failed to load history', err)
    }
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim().length < 5) {
      setError('Text must be at least 5 characters long.')
      return
    }
    if (inputText.length > 5000) {
      setError('Text must be under 5000 characters.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeText(inputText)
      setResult(data)
      // Pulse animation effect on result cards
      setTimeout(() => {
        const panels = document.querySelectorAll('.glass-panel')
        panels.forEach((panel) => {
          panel.animate(
            [
              { boxShadow: '0 0 0px rgba(173, 198, 255, 0)' },
              { boxShadow: '0 0 30px rgba(173, 198, 255, 0.2)' },
              { boxShadow: '0 0 0px rgba(173, 198, 255, 0)' }
            ],
            { duration: 1000 }
          )
        })
      }, 50)
      // Refresh history list
      fetchHistory()
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result?.summary) return
    navigator.clipboard.writeText(result.summary)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleDownload = () => {
    if (!result) return
    const reportText = `Sentiment AI Analysis Report
---------------------------------
Generated on: ${new Date().toLocaleString()}
Input Text:
"${inputText}"

RESULTS:
Sentiment: ${result.sentiment}
Confidence: ${(result.confidence * 100).toFixed(2)}%
Processing Time: ${result.processing_time_ms} ms

SUMMARY:
${result.summary}
`
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sentiment_report_${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getSentimentColor = (sentiment: string) => {
    const s = sentiment.toLowerCase()
    if (s.includes('positive')) return 'text-secondary'
    if (s.includes('negative')) return 'text-[#ffb4ab]'
    return 'text-[#c2c6d6]'
  }

  const getSentimentBarBg = (sentiment: string) => {
    const s = sentiment.toLowerCase()
    if (s.includes('positive')) return 'bg-secondary'
    if (s.includes('negative')) return 'bg-[#ffb4ab]'
    return 'bg-[#c2c6d6]'
  }

  const getSentimentEmoji = (sentiment: string) => {
    const s = sentiment.toLowerCase()
    if (s.includes('positive')) return '😊'
    if (s.includes('negative')) return '😞'
    return '😐'
  }

  const loadFromHistory = (item: AnalysisHistoryItem) => {
    setInputText(item.original_text)
    setResult({
      sentiment: item.sentiment,
      confidence: item.confidence,
      summary: item.summary,
      processing_time_ms: item.processing_time_ms
    })
    setActiveTab('home')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#10131a]/80 backdrop-blur-xl border-b border-white/10 h-16">
        <nav className="flex justify-between items-center px-6 md:px-8 max-w-7xl mx-auto h-full w-full">
          <div 
            className="font-display text-2xl font-bold text-primary cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            Sentiment AI
          </div>
          <div className="hidden md:flex items-center space-x-6 h-full">
            <button
              onClick={() => setActiveTab('home')}
              className={`pb-1 font-body-md text-base transition-colors ${
                activeTab === 'home'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-1 font-body-md text-base transition-colors ${
                activeTab === 'history'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              History
              {historyCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-white/10 text-primary rounded-full">
                  {historyCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-1 font-body-md text-base transition-colors ${
                activeTab === 'about'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              About
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Backend Health Status badge */}
            <div className="flex items-center gap-1.5 text-xs font-label-sm">
              <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-on-surface-variant hidden sm:inline">
                {isBackendHealthy === null ? 'Checking...' : isBackendHealthy ? 'Engine Online' : 'Engine Offline'}
              </span>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-white/5 transition-all duration-250 active:scale-95 text-primary"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col justify-start">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            
            {/* Left Panel: Analyze Text */}
            <section className="flex flex-col gap-6">
              <h2 className="font-display text-3xl font-semibold text-on-surface text-left">Analyze Text</h2>
              <form onSubmit={handleAnalyze} className="glass-panel rounded-xl p-6 flex flex-col gap-4 relative min-h-[400px]">
                <textarea
                  className="flex-grow bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant/40 resize-none font-body-lg text-lg custom-scrollbar outline-none"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or paste a sentence or paragraph..."
                />
                
                {error && (
                  <div className="text-xs text-[#ffb4ab] bg-red-950/40 p-2.5 rounded border border-red-900/40 text-left">
                    {error}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto pt-4 border-t border-white/5">
                  <span className="font-label-sm text-xs text-on-surface-variant">
                    {inputText.length.toLocaleString()} Characters
                  </span>
                  <button
                    type="submit"
                    disabled={inputText.trim().length < 5 || loading}
                    className={`w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-primary to-secondary text-[#00285d] font-semibold rounded-lg btn-glow transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      (inputText.trim().length < 5 || loading) ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    Analyze Text
                    <span className="material-symbols-outlined text-lg">bolt</span>
                  </button>
                </div>

                {/* Loader Overlay */}
                {loading && (
                  <div className="absolute inset-0 glass-panel rounded-xl flex flex-col items-center justify-center z-10 gap-6 bg-[#0f1b33]/90">
                    <div className="w-24 h-24">
                      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" fill="#adc6ff" r="10">
                          <animate attributeName="r" dur="1.5s" repeatCount="indefinite" values="10;25;10" />
                          <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="1;0;1" />
                        </circle>
                        <circle cx="50" cy="50" fill="#5de6ff" r="5">
                          <animate attributeName="r" dur="1.5s" repeatCount="indefinite" values="5;15;5" />
                        </circle>
                      </svg>
                    </div>
                    <p className="font-label-md text-xs text-primary animate-pulse font-medium">
                      Analyzing sentiment &amp; generating summary...
                    </p>
                  </div>
                )}
              </form>
            </section>

            {/* Right Panel: Results */}
            <section className="flex flex-col gap-6">
              <h2 className="font-display text-3xl font-semibold text-on-surface text-left">Results</h2>
              <div className="flex flex-col gap-6 h-full">
                
                {/* Card 1: Sentiment */}
                <div className="glass-panel rounded-xl p-6 sentiment-glow text-left flex flex-col justify-center min-h-[120px]">
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest mb-3 block font-semibold">
                    Sentiment Classification
                  </label>
                  {result ? (
                    <div className="flex items-center gap-4 w-full">
                      <span className={`font-display text-2xl font-bold ${getSentimentColor(result.sentiment)} whitespace-nowrap`}>
                        {result.sentiment} {getSentimentEmoji(result.sentiment)}
                      </span>
                      <div className="h-2 flex-grow bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getSentimentBarBg(result.sentiment)} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(5, result.confidence * 100))}%` }}
                        ></div>
                      </div>
                      <span className={`font-label-md text-sm font-semibold ${getSentimentColor(result.sentiment)}`}>
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-on-surface-variant/50 text-sm italic">
                      Submit text on the left to see sentiment results.
                    </p>
                  )}
                </div>

                {/* Card 2: Summary */}
                <div className="glass-panel rounded-xl p-6 min-h-[180px] text-left flex flex-col">
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest mb-3 block font-semibold">
                    Summary
                  </label>
                  {result ? (
                    <p className="text-on-surface/90 font-body-lg text-base leading-relaxed flex-grow">
                      {result.summary}
                    </p>
                  ) : (
                    <p className="text-on-surface-variant/50 text-sm italic flex-grow">
                      Submit text to generate an AI summary.
                    </p>
                  )}
                  {result && (
                    <div className="text-right text-xs text-on-surface-variant/40 mt-4 font-label-sm">
                      Processing time: {result.processing_time_ms} ms
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                {result && (
                  <div className="flex flex-wrap items-center gap-3 mt-auto justify-start">
                    <button
                      onClick={() => setActiveTab('history')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-on-surface-variant hover:text-primary active:scale-95 text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">history</span>
                      <span>History</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-on-surface-variant hover:text-primary active:scale-95 text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Download Report</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-on-surface-variant hover:text-primary active:scale-95 text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copySuccess ? 'check' : 'content_copy'}
                      </span>
                      <span>{copySuccess ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <section className="flex flex-col gap-6 w-full text-left">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-3xl font-semibold text-on-surface">Analysis History</h2>
              <button
                onClick={fetchHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs text-primary font-semibold"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh
              </button>
            </div>
            
            <div className="glass-panel rounded-xl p-6 custom-scrollbar overflow-x-auto">
              {historyItems.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant/50">
                  <span className="material-symbols-outlined text-4xl mb-2">database</span>
                  <p>No analysis records found. Create one on the Home tab!</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-on-surface-variant font-label-sm uppercase text-xs">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Original Text</th>
                      <th className="py-3 px-4">Sentiment</th>
                      <th className="py-3 px-4">Confidence</th>
                      <th className="py-3 px-4">Processing Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {item.original_text}
                        </td>
                        <td className={`py-3 px-4 font-bold ${getSentimentColor(item.sentiment)}`}>
                          {item.sentiment} {getSentimentEmoji(item.sentiment)}
                        </td>
                        <td className="py-3 px-4">
                          {(item.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {item.processing_time_ms} ms
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => loadFromHistory(item)}
                            className="text-primary hover:underline font-semibold text-xs"
                          >
                            Load Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === 'about' && (
          <section className="flex flex-col gap-6 w-full text-left max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-on-surface">About Sentiment AI</h2>
            <div className="glass-panel rounded-xl p-8 flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Neural Engine Powered</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  Sentiment AI runs models that analyze input text in real-time, extracting exact psychological tones and generating summarizing paragraphs.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Sentiment Classifier</h4>
                  <p className="text-sm font-semibold">cardiffnlp/twitter-roberta-base-sentiment-latest</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    RoBERTa model fine-tuned for sentiment analysis on Twitter. Detects Positive, Neutral, and Negative sentiments.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Summarization Model</h4>
                  <p className="text-sm font-semibold">sshleifer/distilbart-cnn-12-6</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Distilled BART model trained on CNN/DailyMail. Generates abstractive, highly readable summaries of larger texts.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Technical Architecture</h4>
                <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1 mt-1">
                  <li>Backend: FastAPI (Python)</li>
                  <li>Frontend: React 19 + TypeScript + Tailwind CSS</li>
                  <li>Build Tool: Vite</li>
                  <li>Database: SQLite with SQLAlchemy ORM</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 bg-[#0b0e15] border-t border-white/5 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-8 max-w-7xl mx-auto gap-4 w-full">
          <span className="text-on-surface-variant font-medium text-xs">
            © 2026 Sentiment AI. Powered by Neural Engine.
          </span>
          <div className="flex gap-6 text-xs">
            <a className="text-on-surface-variant hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">Privacy</a>
            <a className="text-on-surface-variant hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">Terms</a>
            <a className="text-on-surface-variant hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
