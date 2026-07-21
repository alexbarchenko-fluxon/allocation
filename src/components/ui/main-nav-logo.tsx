import { Link } from 'react-router-dom'
import AlloxIcon from '@/assets/logos/allox-icon.svg?react'
import AlloxText from '@/assets/logos/allox-text.svg?react'

export interface MainNavLogoProps {
  className?: string
}

export function MainNavLogo({ className }: MainNavLogoProps) {
  return (
    <Link 
      to="/" 
      className={`flex items-center gap-2.5 ${className || ''}`}
    >
      <AlloxIcon className="w-[34px] h-[34px] shrink-0" />
      <AlloxText className="w-[46px] h-[16px] shrink-0" />
    </Link>
  )
}
