'use client'

import { useState } from 'react'

interface SidebarLogoProps {
  src: string
  alt: string
  className?: string
}

export default function SidebarLogo({ src, alt, className = "" }: SidebarLogoProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return null // Just hide the image if it fails to load
  }

  return (
    <img 
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}