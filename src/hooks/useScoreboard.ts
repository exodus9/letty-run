import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { getFlavorFromUrlOrStorage, getNicknameFromUrlOrStorage } from "@/lib/utils";

interface ScoreboardEntry {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
}

const GAME_ID = import.meta.env.VITE_GAME_ID;

// 테이블 선택을 위한 헬퍼 함수
const getTableName = (flavor?: string): 'scoreboard' | 'scoreboard_celeb' => {
  if (flavor && flavor.toLowerCase() === 'celeb') {
    return 'scoreboard_celeb';
  }
  return 'scoreboard';
};

export const useScoreboard = () => {
  const [scores, setScores] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get flavor from URL only
  const flavor = getFlavorFromUrlOrStorage();

  // Fetch top 10 scores from today (Korean time)
  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get Korean timezone date
      const koreanTz = 'Asia/Seoul';
      const now = new Date();
      const koreanDate = formatInTimeZone(now, koreanTz, 'yyyy-MM-dd');
      
      const tableName = getTableName(flavor);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('game_id', GAME_ID)
        .gte('created_at', `${koreanDate}T00:00:00+09:00`)
        .lt('created_at', `${koreanDate}T23:59:59+09:00`)
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      
      setScores(data || []);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scores');
    } finally {
      setLoading(false);
    }
  }, [flavor]);

  // Check if player already has a score today
  const checkExistingScore = async (playerName: string): Promise<number | null> => {
    try {
      const koreanTz = 'Asia/Seoul';
      const now = new Date();
      const koreanDate = formatInTimeZone(now, koreanTz, 'yyyy-MM-dd');

      const tableName = getTableName(flavor);
      const { data, error } = await supabase
        .from(tableName)
        .select('score')
        .eq('game_id', GAME_ID)
        .eq('player_name', playerName.trim().toUpperCase())
        .gte('created_at', `${koreanDate}T00:00:00+09:00`)
        .lt('created_at', `${koreanDate}T23:59:59+09:00`)
        .order('score', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data && data.length > 0 ? data[0].score : null;
    } catch (err) {
      console.error('Error checking existing score:', err);
      return null;
    }
  };

  // Check if a score qualifies for top 10
  const checkQualifiesForTop10 = async (score: number): Promise<boolean> => {
    try {
      // Get Korean timezone date
      const koreanTz = 'Asia/Seoul';
      const now = new Date();
      const koreanDate = formatInTimeZone(now, koreanTz, 'yyyy-MM-dd');

      const tableName = getTableName(flavor);
      const { data, error } = await supabase
        .from(tableName)
        .select('score')
        .eq('game_id', GAME_ID)
        .gte('created_at', `${koreanDate}T00:00:00+09:00`)
        .lt('created_at', `${koreanDate}T23:59:59+09:00`)
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      // If less than 10 scores, automatically qualifies
      if (!data || data.length < 10) return true;

      // Check if score is higher than the lowest in top 10
      const lowestTopScore = data[data.length - 1]?.score || 0;
      return score > lowestTopScore;
    } catch (err) {
      console.error('Error checking qualification:', err);
      return false;
    }
  };

  // Submit a new score via secure Edge Function
  const submitScore = async (score: number): Promise<{ success: boolean; shouldShowError: boolean }> => {
    // Get player name from localStorage or URL, default to 'NONAME'
    const playerName = getNicknameFromUrlOrStorage();

    // Only submit scores that are 0 or higher
    if (score < 0) {
      return { success: false, shouldShowError: false };
    }

    try {
      // Check if player already has a score today
      const existingScore = await checkExistingScore(playerName);

      if (existingScore !== null) {
        // Player already has a score today
        if (score <= existingScore) {
          // New score is not higher, don't submit - but don't show error toast
          console.log(`Score not submitted: existing score (${existingScore}) is higher or equal to new score (${score})`);
          return { success: false, shouldShowError: false };
        }
        // New score is higher, will be submitted and old one will be deleted by Edge Function
      }

      const tableName = getTableName(flavor);

      // Submit via Edge Function for server-side validation
      const { data, error } = await supabase.functions.invoke('submit-score', {
        body: {
          game_id: GAME_ID,
          player_name: playerName,
          score: score,
          table: tableName
        }
      });

      // Log the full response for debugging
      console.log('Edge Function response:', { data, error });

      // Check for network/invocation errors first
      if (error) {
        console.error('Score submission error:', error);
        setError(error.message || 'Failed to submit score');
        return { success: false, shouldShowError: true };
      }

      // Check if the response contains an error message from the Edge Function
      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        setError(data.error);
        return { success: false, shouldShowError: true };
      }

      // Check for explicit success flag
      if (data?.success === true) {
        console.log('Score submitted successfully');
        // Refresh scores after submission
        await fetchScores();
        return { success: true, shouldShowError: false };
      }

      // If we get here, the response format is unexpected
      console.warn('Unexpected Edge Function response format:', data);

      // Refresh scores anyway to check if it was actually submitted
      await fetchScores();
      return { success: true, shouldShowError: false };

    } catch (err) {
      console.error('Error submitting score:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit score');
      return { success: false, shouldShowError: true };
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchScores();

    const tableName = getTableName(flavor);
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `game_id=eq.${GAME_ID}`
        },
        () => {
          fetchScores(); // Refetch when data changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScores, flavor]);

  return {
    scores,
    loading,
    error,
    fetchScores,
    checkExistingScore,
    checkQualifiesForTop10,
    submitScore
  };
};