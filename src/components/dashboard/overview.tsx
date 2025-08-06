"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface OverviewProps {
  data: any[]
  isLoading?: boolean
}

export function Overview({ data = [], isLoading = false }: OverviewProps) {
  if (isLoading) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center">
        <div className="w-full space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis 
          dataKey="date" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}`} 
        />
        <Tooltip
          formatter={(value: number) => [`${value} conversas`, "Total"]}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Bar 
          dataKey="conversations" 
          fill="currentColor" 
          radius={[4, 4, 0, 0]} 
          className="fill-primary" 
        />
      </BarChart>
    </ResponsiveContainer>
  )
}