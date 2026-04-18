"use client";

import { Card, Flex, Metric, Text } from "@tremor/react";
import clsx from "clsx";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "stable";
  variant?: "default" | "warning" | "danger";
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "from last period",
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    stable: "text-gray-600 dark:text-gray-400",
  };

  const variantStyles = {
    default: "border border-gray-200 dark:border-gray-700",
    warning: "border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    danger: "border border-red-400 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div
      className={clsx(
        "rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-800",
        variantStyles[variant],
        className
      )}
    >
      <Flex alignItems="start" className="gap-3">
        <div className="min-w-0 flex-1">
          <Text className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </Text>
          <Metric className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </Metric>
        </div>
      </Flex>
      {change !== undefined && (
        <Flex className="mt-3">
          <p
            className={clsx(
              "text-sm font-medium",
              trend ? trendColors[trend] : "text-gray-500 dark:text-gray-400"
            )}
          >
            {trend === "up" && "+"}
            {trend === "down" && "-"}
            {Math.abs(change)} {changeLabel}
          </p>
        </Flex>
      )}
    </div>
  );
}