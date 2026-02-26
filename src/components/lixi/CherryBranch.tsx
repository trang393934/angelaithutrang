import { motion } from "framer-motion";

interface CherryBranchProps {
  side: "left" | "right";
  position?: "top" | "middle";
}

export function CherryBranch({ side, position = "top" }: CherryBranchProps) {
  const isLeft = side === "left";
  const isMiddle = position === "middle";

  const topFlowers = isLeft
    ? [
        { x: 10, y: 18, s: 14 }, { x: 25, y: 8, s: 12 }, { x: 40, y: 25, s: 10 },
        { x: 5, y: 40, s: 11 }, { x: 30, y: 38, s: 8 }, { x: 18, y: 50, s: 13 },
      ]
    : [
        { x: 60, y: 18, s: 14 }, { x: 75, y: 8, s: 12 }, { x: 90, y: 25, s: 10 },
        { x: 95, y: 40, s: 11 }, { x: 70, y: 38, s: 8 }, { x: 82, y: 50, s: 13 },
      ];

  const middleFlowers = isLeft
    ? [
        { x: 2, y: 20, s: 10 }, { x: 8, y: 45, s: 12 }, { x: 3, y: 70, s: 9 },
        { x: 12, y: 55, s: 8 },
      ]
    : [
        { x: 88, y: 20, s: 10 }, { x: 95, y: 45, s: 12 }, { x: 90, y: 70, s: 9 },
        { x: 97, y: 85, s: 8 },
      ];

  const flowers = isMiddle ? middleFlowers : topFlowers;

  if (isMiddle) {
    return (
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Side branch */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {isLeft ? (
            <path d="M-2 10 Q5 30 3 50 Q1 70 4 90" stroke="#5D3A1A" strokeWidth="0.5" fill="none" opacity="0.4" />
          ) : (
            <path d="M102 10 Q95 30 97 50 Q99 70 96 90" stroke="#5D3A1A" strokeWidth="0.5" fill="none" opacity="0.4" />
          )}
        </svg>
        {flowers.map((f, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.s, height: f.s }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: i % 2 === 0
                  ? "radial-gradient(circle, #fff 20%, #ffb7c5 60%, #ff69b4 100%)"
                  : "radial-gradient(circle, #fff 20%, #ffe066 60%, #ffd700 100%)",
                boxShadow: "0 0 4px rgba(255,105,180,0.4)",
              }}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute top-0 inset-x-0 h-24 pointer-events-none z-10 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        {isLeft ? (
          <>
            <path d="M-5 0 Q15 15 45 30" stroke="#5D3A1A" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M0 5 Q20 20 35 40" stroke="#5D3A1A" strokeWidth="0.6" fill="none" opacity="0.5" />
          </>
        ) : (
          <>
            <path d="M105 0 Q85 15 55 30" stroke="#5D3A1A" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M100 5 Q80 20 65 40" stroke="#5D3A1A" strokeWidth="0.6" fill="none" opacity="0.5" />
          </>
        )}
      </svg>
      {flowers.map((f, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.s, height: f.s }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: i % 3 === 0
                ? "radial-gradient(circle, #fff 20%, #ffb7c5 60%, #ff69b4 100%)"
                : i % 3 === 1
                ? "radial-gradient(circle, #fff 20%, #ffe066 60%, #ffd700 100%)"
                : "radial-gradient(circle, #fff 30%, #ffc0cb 70%, #ff91a4 100%)",
              boxShadow: "0 0 4px rgba(255,105,180,0.4)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
