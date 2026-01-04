export type Database = {
  public: {
    Tables: {
      matches: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          home_score: number | null
          away_score: number | null
          start_time: string
          status: 'scheduled' | 'live' | 'finished'
          round: number
          created_at: string
        }
        Insert: {
          id?: string
          home_team_id: string
          away_team_id: string
          home_score?: number | null
          away_score?: number | null
          start_time: string
          status?: 'scheduled' | 'live' | 'finished'
          round: number
          created_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string
          away_team_id?: string
          home_score?: number | null
          away_score?: number | null
          start_time?: string
          status?: 'scheduled' | 'live' | 'finished'
          round?: number
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          total_points: number
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          total_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          total_points?: number
          created_at?: string
        }
      }
    }
  }
}







