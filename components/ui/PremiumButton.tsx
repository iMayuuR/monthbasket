"use client";

import * as React from "react";
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check, Sparkles, Zap, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

const premiumButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 overflow-hidden group",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 text-white shadow-md hover:shadow-lg hover:shadow-primary-500/50 dark:shadow-primary-900/50 dark:hover:shadow-primary-500/30",
        secondary:
          "border-2 border-primary/20 bg-white/50 text-gray-800 backdrop-blur-sm hover:border-primary/40 hover:bg-primary-50/50 dark:bg-gray-800/50 dark:text-gray-200 dark:border-primary/30 dark:hover:bg-primary-900/30",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
        danger:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:shadow-lg hover:shadow-red-500/50 dark:shadow-red-900/50",
        success:
          "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md hover:shadow-lg hover:shadow-violet-500/50 dark:shadow-violet-900/50",
        outline:
          "bg-transparent border-2 border-primary/40 text-primary-600 hover:bg-primary-50 hover:border-primary dark:border-primary/30 dark:text-primary-400 dark:hover:bg-primary-900/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type PremiumButtonProps = Omit<
  HTMLMotionProps<"button"> & React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onTransitionEnd"
> & {
  variant?: VariantProps<typeof premiumButtonVariants>["variant"];
  size?: VariantProps<typeof premiumButtonVariants>["size"];
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  magnetic?: boolean;
  fullWidth?: boolean;
  showArrow?: boolean;
};

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      icon,
      iconPosition = "left",
      magnetic = true,
      fullWidth = false,
      showArrow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [canHover, setCanHover] = React.useState(false);

    // Detect hover capability (desktop only)
    React.useEffect(() => {
      const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
      const update = () => setCanHover(mql.matches);
      update();
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }, []);

    const springConfig = { damping: 25, stiffness: 300 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || disabled || loading) return;
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      mouseX.set(distanceX * 0.2);
      mouseY.set(distanceY * 0.2);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    React.useImperativeHandle(ref, () => buttonRef.current!);

    return (
      <motion.button
        ref={buttonRef}
        className={cn(premiumButtonVariants({ variant, size, className }), fullWidth && "w-full")}
        disabled={disabled || loading}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x, y }}
        whileHover={canHover ? { scale: 1.02 } : {}}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Animated gradient background for gradient variants */}
        {(variant === "primary" || variant === "danger" || variant === "success") && (
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                variant === "primary"
                  ? "linear-gradient(45deg, rgba(147, 51, 234, 0.5), rgba(168, 85, 247, 0.5), rgba(192, 132, 252, 0.5))"
                  : variant === "danger"
                  ? "linear-gradient(45deg, rgba(239, 68, 68, 0.5), rgba(244, 63, 94, 0.5))"
                  : "linear-gradient(45deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5))",
              backgroundSize: "200% 200%",
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
          }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Border glow effect for gradient variants */}
        {(variant === "primary" || variant === "danger" || variant === "success") && (
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  variant === "primary"
                    ? "linear-gradient(45deg, #9333ea, #a855f7, #c084fc)"
                    : variant === "danger"
                    ? "linear-gradient(45deg, #ef4444, #f43f5e)"
                    : "linear-gradient(45deg, #8b5cf6, #a855f7)",
                filter: "blur(8px)",
                opacity: 0.6,
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
              {children}
              {showArrow && <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />}
              {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
            </>
          )}
        </span>

        {/* Pulse effect on click */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/30"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton, premiumButtonVariants };
export type { PremiumButtonProps };
