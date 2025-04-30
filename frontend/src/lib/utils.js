import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs) => {
  return twMerge(clsx(inputs))
}

// Color extraction utility
export const getAverageColor = (imageElement) => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  canvas.width = imageElement.width
  canvas.height = imageElement.height

  context.drawImage(imageElement, 0, 0)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data

  let r = 0,
    g = 0,
    b = 0,
    count = 0

  // Sample pixels (every 5th pixel to improve performance)
  for (let i = 0; i < imageData.length; i += 20) {
    r += imageData[i]
    g += imageData[i + 1]
    b += imageData[i + 2]
    count++
  }

  // Calculate average
  r = Math.floor(r / count)
  g = Math.floor(g / count)
  b = Math.floor(b / count)

  return { r, g, b }
}

// Format time in minutes:seconds
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}
