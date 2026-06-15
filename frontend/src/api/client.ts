export interface AnalyzeRequest {
  text: string;
}

export interface AnalyzeResponse {
  sentiment: string;
  confidence: number;
  summary: string;
  processing_time_ms: number;
}

export interface AnalysisHistoryItem {
  id: number;
  original_text: string;
  sentiment: string;
  confidence: number;
  summary: string;
  processing_time_ms: number;
  created_at: string;
}

export interface HistoryResponse {
  items: AnalysisHistoryItem[];
  total: number;
}

export interface HealthResponse {
  status: string;
}

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  const response = await fetch('/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = 'Failed to analyze text';
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((err: any) => err.msg || err).join(', ');
      } else {
        errorMessage = errorData.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getHistory(limit: number = 20): Promise<HistoryResponse> {
  const response = await fetch(`/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  return response.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}
