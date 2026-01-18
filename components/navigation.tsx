'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Phone,
  BookOpen,
  CreditCard,
  User,
  LogOut,
  Settings,
  Shield,
  Stethoscope,
  Calendar,
  FileText,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Navigation() {
  const { user, isLoading, isLoggedIn, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">HealthConnect</h1>
            </div>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    )
  }

  if (!isLoggedIn) {
    return (
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">HealthConnect</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      { href: '/', label: 'Home', icon: Heart },
      { href: '/consultation', label: 'Consultations', icon: Phone },
      { href: '/education', label: 'Education', icon: BookOpen },
    ]

    if (user?.role === 'Patient') {
      return [
        ...baseItems,
        { href: '/payments', label: 'Payments', icon: CreditCard },
      ]
    }

    if (user?.role === 'Doctor') {
      return [
        ...baseItems,
        { href: '/doctor', label: 'Doctor Dashboard', icon: Stethoscope },
        { href: '/doctor/consultations', label: 'My Consultations', icon: Calendar },
      ]
    }

    if (user?.role === 'Admin') {
      return [
        ...baseItems,
        { href: '/admin', label: 'Admin Dashboard', icon: Shield },
        { href: '/admin/users', label: 'Users', icon: User },
        { href: '/admin/consultations', label: 'All Consultations', icon: FileText },
      ]
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">HealthConnect</h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <div className="text-sm">
                <div className="font-medium">{user?.full_name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

