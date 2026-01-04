"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"
import { Database } from "@/lib/supabase/types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface RankingTableProps {
  profiles: Profile[]
}

export function RankingTable({ profiles }: RankingTableProps) {
  const sortedProfiles = [...profiles].sort(
    (a, b) => b.total_points - a.total_points
  )

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge variant="warning">🥇</Badge>
      case 1:
        return <Badge variant="secondary">🥈</Badge>
      case 2:
        return <Badge variant="secondary">🥉</Badge>
      default:
        return <span className="text-sm text-muted-foreground">{index + 1}°</span>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranking de Profetas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="text-right">Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No hay participantes aún
                </TableCell>
              </TableRow>
            ) : (
              sortedProfiles.map((profile, index) => (
                <TableRow
                  key={profile.id}
                  className={index < 3 ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRankIcon(index)}
                      {getRankBadge(index)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {profile.username}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {profile.total_points}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}







