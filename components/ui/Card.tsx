"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type CardProps = Omit<
  HTMLMotionProps<"div"> & React.HTMLAttributes<HTMLDivElement>,
  "onAnimationStart" | "onAnimationEnd" | "onTransitionEnd"
> & {
  hoverable?: boolean;
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", children, hoverable = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={`rounded-2xl bg-white p-4 shadow-sm border border-gray-100 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={
          hoverable
            ? {
                y: -4,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
              }
            : {}
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export default Card;
