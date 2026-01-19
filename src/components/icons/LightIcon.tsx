import { cn } from "@/lib/utils";

interface LightIconProps {
  className?: string;
  size?: number;
}

export const LightIcon = ({ className, size = 24 }: LightIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)}
  >
    <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path
      d="M12 2V4M12 20V22M4 12H2M6.31 6.31L4.9 4.9M17.69 6.31L19.1 4.9M6.31 17.69L4.9 19.1M17.69 17.69L19.1 19.1M22 12H20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

export const AngelWingIcon = ({ className, size = 32 }: LightIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)}
  >
    <path
      d="M16 8C16 8 8 10 4 16C8 14 12 13 16 14C12 13 8 14 4 16C8 18 12 18 16 17C12 18 8 18 4 16C8 22 16 24 16 24"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    />
    <path
      d="M16 8C16 8 24 10 28 16C24 14 20 13 16 14C20 13 24 14 28 16C24 18 20 18 16 17C20 18 24 18 28 16C24 22 16 24 16 24"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    />
    <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6" />
  </svg>
);

export const CosmicStarIcon = ({ className, size = 24 }: LightIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)}
  >
    <path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill="currentColor"
      opacity="0.3"
    />
    <path
      d="M12 6L12.75 9.25L16 10L12.75 10.75L12 14L11.25 10.75L8 10L11.25 9.25L12 6Z"
      fill="currentColor"
    />
  </svg>
);

export const DivineLightIcon = ({ className, size = 40 }: LightIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)}
  >
    <defs>
      <radialGradient id="divineGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#divineGlow)" />
    <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.2" />
    <circle cx="20" cy="20" r="3" fill="currentColor" />
    <path
      d="M20 4V8M20 32V36M4 20H8M32 20H36M8.5 8.5L11.5 11.5M28.5 28.5L31.5 31.5M8.5 31.5L11.5 28.5M28.5 11.5L31.5 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);
