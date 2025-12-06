import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    // Allow request to continue but auth checks will fail gracefully
    // This prevents the middleware from crashing the app
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/']
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to role-specific dashboard
  if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup')) {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, allow access to signup/login (might be creating profile)
    if (profileError || !profile) {
      // Don't redirect if profile doesn't exist - let them complete signup
      return NextResponse.next()
    }

    let redirectTo = '/'
    if (profile.role === 'Admin') {
      redirectTo = '/admin'
    } else if (profile.role === 'Doctor') {
      redirectTo = '/doctor'
    } else if (profile.role === 'Patient') {
      redirectTo = '/dashboard'
    }

    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Role-based route protection and redirects
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, redirect to signup to complete profile
    if (profileError || !profile) {
      // Allow access to signup page
      if (request.nextUrl.pathname === '/auth/signup') {
        return NextResponse.next()
      }
      // Redirect to signup if trying to access protected routes
      if (!isPublicRoute) {
        return NextResponse.redirect(new URL('/auth/signup', request.url))
      }
      return NextResponse.next()
    }

    const userRole = profile.role

    // Redirect authenticated users from home page to their role-specific dashboard
    if (request.nextUrl.pathname === '/') {
      if (userRole === 'Admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (userRole === 'Doctor') {
        return NextResponse.redirect(new URL('/doctor', request.url))
      } else if (userRole === 'Patient') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Admin routes - protect both pages and API routes
    if (
      (request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/api/admin')) &&
      userRole !== 'Admin'
    ) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Doctor routes
    if (
      request.nextUrl.pathname.startsWith('/doctor') &&
      userRole !== 'Doctor' &&
      userRole !== 'Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

