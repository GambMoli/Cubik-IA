import type { IconProps } from './IconProps'

export function UserAvatarIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M6.5 18C7.5 15.7 9.5 14.5 12 14.5C14.5 14.5 16.5 15.7 17.5 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
