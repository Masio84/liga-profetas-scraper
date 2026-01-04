"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/lib/supabase/types"
import { Clock, Lock } from "lucide-react"

type Match = Database["public"]["Tables"]["matches"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]

interface MatchCardProps {
  match: Match & {
    home_team: Team
    away_team: Team
  }
  onPredictionChange?: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  initialHomeScore?: number | null
  initialAwayScore?: number | null
}

export function MatchCard({
  match,
  onPredictionChange,
  initialHomeScore,
  initialAwayScore,
}: MatchCardProps) {
  const [homeScore, setHomeScore] = useState<string>(
    initialHomeScore?.toString() || ""
  )
  const [awayScore, setAwayScore] = useState<string>(
    initialAwayScore?.toString() || ""
  )
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const checkLockStatus = () => {
      const now = new Date()
      const startTime = new Date(match.start_time)
      const isPastStartTime = now >= startTime
      const isLiveOrFinished = match.status === "live" || match.status === "finished"
      
      setIsLocked(isPastStartTime || isLiveOrFinished)
    }

    checkLockStatus()
    const interval = setInterval(checkLockStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [match.start_time, match.status])

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      setHomeScore(value)
      if (onPredictionChange) {
        onPredictionChange(
          match.id,
          value === "" ? null : parseInt(value, 10),
          awayScore === "" ? null : parseInt(awayScore, 10)
        )
      }
    }
  }

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      setAwayScore(value)
      if (onPredictionChange) {
        onPredictionChange(
          match.id,
          homeScore === "" ? null : parseInt(homeScore, 10),
          value === "" ? null : parseInt(value, 10)
        )
      }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case "live":
        return <Badge variant="destructive">En Vivo</Badge>
      case "finished":
        return <Badge variant="success">Finalizado</Badge>
      default:
        return <Badge variant="secondary">Programado</Badge>
    }
  }

  const displayHomeScore = isLocked && match.home_score !== null
    ? match.home_score
    : homeScore
  const displayAwayScore = isLocked && match.away_score !== null
    ? match.away_score
    : awayScore

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {formatTime(match.start_time)}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Equipo Local */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              {match.home_team.logo_url ? (
                <Image
                  src={match.home_team.logo_url}
                  alt={match.home_team.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {match.home_team.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-center max-w-[120px] truncate">
              {match.home_team.name}
            </p>
            <Input
              type="number"
              min="0"
              value={displayHomeScore}
              onChange={handleHomeScoreChange}
              disabled={isLocked}
              className="w-16 text-center text-lg font-bold"
              placeholder="0"
            />
          </div>

          {/* Separador */}
          <div className="flex flex-col items-center gap-2">
            {isLocked && (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-2xl font-bold">-</span>
          </div>

          {/* Equipo Visitante */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              {match.away_team.logo_url ? (
                <Image
                  src={match.away_team.logo_url}
                  alt={match.away_team.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {match.away_team.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-center max-w-[120px] truncate">
              {match.away_team.name}
            </p>
            <Input
              type="number"
              min="0"
              value={displayAwayScore}
              onChange={handleAwayScoreChange}
              disabled={isLocked}
              className="w-16 text-center text-lg font-bold"
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

