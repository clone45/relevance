import { useState, useEffect } from 'react';

export interface FriendSuggestion {
  id: string;
  name: string;
  email: string;
  reason: string;
  reasonLabel: string;
}

interface FriendSuggestionsResponse {
  suggestions: FriendSuggestion[];
  total: number;
}

export function useFriendSuggestions() {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends/suggestions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch friend suggestions');
      }

      const data: FriendSuggestionsResponse = await response.json();
      setSuggestions(data.suggestions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSuggestion = (userId: string) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== userId));
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    removeSuggestion,
  };
}