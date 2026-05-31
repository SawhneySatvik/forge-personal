"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Responsive 6-column bento grid with a subtle staggered entrance. */
export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6", className)}
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

const SPAN: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  6: "lg:col-span-6",
};

export function BentoItem({
  className,
  children,
  span = 2,
}: {
  className?: string;
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 6;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(SPAN[span], className)}
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
