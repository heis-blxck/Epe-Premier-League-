sed -i '1i\
import React, { useState, useEffect } from "react";\
import { LeagueStats as StatsType, Team, Player, PlayerOfTheWeek } from "../types";\
import { api } from "../services/api";\
import { Flame, Award, ShieldCheck, User, Trophy } from "lucide-react";\
\
interface LeagueStatsProps {\
' src/components/LeagueStats.tsx
