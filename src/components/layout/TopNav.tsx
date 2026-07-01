import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MainNavLogo } from '@/components/ui/main-nav-logo'
import { MainNavButton } from '@/components/ui/main-nav-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AppSwitcher } from '@/components/ui/app-switcher'
import { RoleSwitcher } from './RoleSwitcher'

export default function TopNav() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const isActive = (path: string) => {
    if (path === '/people') {
      return location.pathname.startsWith('/people')
    }
    if (path === '/stats') {
      return location.pathname.startsWith('/stats')
    }
    if (path === '/deals') {
      return location.pathname.startsWith('/deals')
    }
    if (path === '/accounts') {
      return location.pathname.startsWith('/accounts')
    }
    return location.pathname === path
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Deals', path: '/deals' },
    { label: 'Positions', path: '/positions' },
    { label: 'People', path: '/people' },
    { label: 'Accounts', path: '/accounts' },
    { label: 'Stats', path: '/stats' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-sidebar transition-shadow duration-200 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="w-full px-5 py-3 flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center w-[180px]">
          <MainNavLogo />
        </div>

        {/* Center - Navigation Menu */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <MainNavButton
              key={item.path}
              label={item.label}
              href={item.path}
              isActive={isActive(item.path)}
            />
          ))}
        </nav>

        {/* Right side - Tools */}
        <div className="flex items-center justify-end gap-4 w-[180px]">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* App Switcher */}
          <AppSwitcher />

          {/* Avatar + Role Switcher */}
          <RoleSwitcher />
        </div>
      </div>
    </header>
  )
}
