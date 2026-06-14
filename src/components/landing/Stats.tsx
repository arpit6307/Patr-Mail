"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Mail, Server, HardDrive } from "lucide-react";

interface Stat {
  icon: React.ReactNode;
  end: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { icon: <Users className="w-6 h-6" />, end: 10, suffix: "K+", label: "Users" },
  { icon: <Mail className="w-6 h-6" />, end: 50, suffix: "K+", label: "Emails Sent" },
  { icon: <Server className="w-6 h-6" />, end: 99.9, suffix: "%", label: "Uptime" },
  { icon: <HardDrive className="w-6 h-6" />, end: 5, suffix: "GB", label: "Free Storage" },
];

function AnimatedNumber({ end, suffix, inView }: { end: number; suffix: string; inView: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const isFloat = end % 1 !== 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      setValue(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, end]);

  return (
    <span className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-lg shadow-lg overflow-hidden"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50 divide-y md:divide-y-0">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex flex-col items-center gap-2 py-8 px-4 text-center"
              >
                <div className="p-3 rounded-xl bg-patr-orange/10 text-patr-orange">
                  {stat.icon}
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                  <AnimatedNumber end={stat.end} suffix={stat.suffix} inView={inView} />
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
