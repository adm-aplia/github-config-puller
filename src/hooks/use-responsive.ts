import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large'

export interface ResponsiveState {
  windowSize: {
    width: number
    height: number
  }
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLarge: boolean
}

/**
 * Hook para detectar o breakpoint atual e fornecer informações responsivas
 * 
 * Breakpoints:
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - desktop: 1024px - 1439px
 * - large: >= 1440px
 */
export function useResponsive(): ResponsiveState {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })
  
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setWindowSize({ 
        width, 
        height: window.innerHeight 
      })
      
      // Determine breakpoint based on width
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else if (width < 1440) {
        setBreakpoint('desktop')
      } else {
        setBreakpoint('large')
      }
    }
    
    // Set initial values
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return {
    windowSize,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'large',
    isLarge: breakpoint === 'large',
  }
}
