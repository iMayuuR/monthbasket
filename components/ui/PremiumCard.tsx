"use client";

import * as React from "react";
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const premiumCardVariants = cva(
  "relative group overflow-hidden rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-gray-900 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300",
        glass:
          "bg-white/40 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl dark:shadow-none",
        gradient:
          "bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-purple-900/10 dark:to-indigo-900/10 backdrop-blur-xl border border-purple-200/50 dark:border-violet-800/20 shadow-sm hover:shadow-xl dark:shadow-none",
        elevated:
          "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl dark:shadow-gray-950",
        minimal:
          "bg-transparent border border-gray-100 dark:border-gray-800 hover:border-primary-500/50 dark:hover:border-primary-500/30",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

type PremiumCardProps = Omit<
  HTMLMotionProps<"div">,
  "onAnimationStart" | "onAnimationEnd" | "onTransitionEnd"
> & {
  variant?: VariantProps<typeof premiumCardVariants>["variant"];
  padding?: VariantProps<typeof premiumCardVariants>["padding"];
  tiltable?: boolean;
  hoverable?: boolean;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  glowColor?: string;
};

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      className,
      variant,
      padding,
      tiltable = true,
      hoverable = true,
      children,
      header,
      footer,
      glowColor = "rgba(147, 51, 234, 0.15)",
      ...props
    },
    ref
  ) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-100, 100], tiltable ? [5, -5] : [0, 0]);
    const rotateY = useTransform(mouseX, [-100, 100], tiltable ? [-5, 5] : [0, 0]);

    const springConfig = { damping: 15, stiffness: 100 };
    const springRotateX = useSpring(rotateX, springConfig);
    const springRotateY = useSpring(rotateY, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltable || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      mouseX.set(distanceX);
      mouseY.set(distanceY);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    React.useImperativeHandle(ref, () => cardRef.current!);

    return (
      <motion.div
        ref={cardRef}
        className={cn(premiumCardVariants({ variant, padding, className }))}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={
          hoverable
            ? {
                scale: 1.01,
                transition: { duration: 0.2 },
              }
            : {}
        }
        {...props}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
        />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 dark:bg-violet-400/20 rounded-full"
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
              style={{
                left: `${20 + i * 30}%`,
                top: `${80 + i * 10}%`,
              }}
            />
          ))}
        </div>

        {/* Content with z-index */}
        <div className="relative z-10">
          {header && <div className="mb-4">{header}</div>}
          {children}

          {/* Subtle border gradient */}
          <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-purple-500/0 via-violet-500/0 to-indigo-500/0 dark:from-purple-400/0 dark:via-violet-400/0 dark:to-indigo-400/0 group-hover:from-purple-500/10 group-hover:via-violet-500/10 group-hover:to-indigo-500/10 dark:group-hover:from-purple-400/10 dark:group-hover:via-violet-400/10 dark:group-hover:to-indigo-400/10" />
          </div>

          {/* Top border glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 dark:via-violet-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {footer && <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">{footer}</div>}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

export { PremiumCard, premiumCardVariants };
export type { PremiumCardProps };
