'use client'

import { useState } from 'react'

interface LogoProps {
  src: string
  alt: string
  className?: string
  fallbackText?: string
}

export default function Logo({ src, alt, className = "", fallbackText = "Slack Archive" }: LogoProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`flex items-center bg-[#4A154B] text-white px-4 rounded ${className}`}>
        <span className="font-bold text-xl">{fallbackText}</span>
      </div>
    )
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