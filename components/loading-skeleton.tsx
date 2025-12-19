"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

