"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function MusicPlayer({ song = {}, roomCode }) {
  // Default empty song object to prevent errors when no song is playing
  const defaultSong = {
    title: "No song playing",
    artist: "Connect to Spotify",
    image_url: "/placeholder.svg?height=300&width=300",
    is_playing: false,
    time: 0,
    duration: 1,
    votes_required_to_skip: 1,
    total_votes: 0,
  }

  // Merge provided song with defaults
  const currentSong = { ...defaultSong, ...song }

  // Calculate song progress percentage
  const songProgress = (currentSong.time / currentSong.duration) * 100 || 0

  // State for dominant color
  const [dominantColor, setDominantColor] = useState("rgba(138, 43, 226, 0.8)")
  const [secondaryColor, setSecondaryColor] = useState("rgba(219, 39, 119, 0.8)")

  // Ref for canvas to extract colors
  const canvasRef = useRef(null)

  // Direct API URL (assuming it's defined in an environment variable)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://your-backend-api.com"

  // Format time in minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Extract dominant color from album art
  useEffect(() => {
    if (currentSong.image_url && currentSong.image_url !== defaultSong.image_url) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = currentSong.image_url

      img.onload = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        // Draw image to canvas
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data

        // Simple color extraction - average of pixels
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

        // Set as dominant color with opacity
        setDominantColor(`rgba(${r}, ${g}, ${b}, 0.8)`)

        // Create a complementary/secondary color
        setSecondaryColor(`rgba(${255 - r}, ${255 - g}, ${255 - b}, 0.8)`)
      }
    } else {
      // Default colors if no image
      setDominantColor("rgba(138, 43, 226, 0.8)")
      setSecondaryColor("rgba(219, 39, 119, 0.8)")
    }
  }, [currentSong.image_url])

  const playSong = async () => {
    try {
      console.log('Sending play request');
      const response = await fetch(`${API_URL}/spotify/play/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      console.log('Play response:', response.status);
    } catch (error) {
      console.error("Failed to play song:", error)
    }
  }

  const pauseSong = async () => {
    try {
      console.log('Sending pause request');
      const response = await fetch(`${API_URL}/spotify/pause/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      console.log('Pause response:', response.status);
    } catch (error) {
      console.error("Failed to pause song:", error)
    }
  }

  const skipSong = async () => {
    try {
      console.log('Sending skip request');
      const response = await fetch(`${API_URL}/spotify/skip/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      console.log('Skip response:', response.status);
    } catch (error) {
      console.error("Failed to skip song:", error)
    }
  }

  return (
    <>
      {/* Hidden canvas for color extraction */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Dynamic background based on album art */}
      <style jsx global>{`
        .room-${roomCode} .animated-bg .blob:nth-child(1) {
          background: ${dominantColor};
        }
        .room-${roomCode} .animated-bg .blob:nth-child(2) {
          background: ${secondaryColor};
        }
        .room-${roomCode} .animated-bg .blob:nth-child(3) {
          background: ${dominantColor};
          opacity: 0.7;
        }
        .room-${roomCode} .animated-bg .blob:nth-child(4) {
          background: ${secondaryColor};
          opacity: 0.7;
        }
      `}</style>

      <Card className="w-full max-w-sm bg-black/40 backdrop-blur-md border-none shadow-2xl overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="flex flex-col items-center">
            {/* Album Art */}
            <div className="relative w-full aspect-square overflow-hidden">
              <img
                src={currentSong.image_url || "/placeholder.svg"}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />

              {/* Reflection effect */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm"></div>
            </div>

            {/* Song Info */}
            <div className="w-full p-6 pt-4">
              <div className="text-center space-y-1 w-full mb-4">
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={currentSong.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl font-bold text-white truncate font-montserrat"
                  >
                    {currentSong.title}
                  </motion.h3>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentSong.artist}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-white/80 truncate"
                  >
                    {currentSong.artist}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <Progress
                  value={songProgress}
                  className="h-2 bg-white/10"
                  style={{
                    "--progress-background": dominantColor,
                  }}
                />

                <div className="flex justify-between text-xs text-white/70">
                  <span>{formatTime(currentSong.time)}</span>
                  <span>{formatTime(currentSong.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between w-full">
                <div className="w-12"></div> {/* Empty space for balance */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={currentSong.is_playing ? pauseSong : playSong}
                  className="h-14 w-14 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
                  style={{
                    background: dominantColor,
                  }}
                >
                  {currentSong.is_playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipSong}
                  className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                >
                  <SkipForward size={22} />
                </Button>
              </div>

              {/* Skip votes */}
              <div className="mt-4 flex items-center justify-center">
                <div className="text-white/80 text-sm bg-white/10 px-4 py-2 rounded-full">
                  {currentSong.total_votes}/{currentSong.votes_required_to_skip} votes to skip
                </div>
              </div>

              {/* Equalizer animation (only shows when playing) */}
              {currentSong.is_playing && (
                <div className="mt-4 flex justify-center">
                  <div className="equalizer">
                    <div className="equalizer-bar h-3" style={{ background: dominantColor }}></div>
                    <div className="equalizer-bar h-5" style={{ background: dominantColor }}></div>
                    <div className="equalizer-bar h-8" style={{ background: dominantColor }}></div>
                    <div className="equalizer-bar h-4" style={{ background: dominantColor }}></div>
                    <div className="equalizer-bar h-6" style={{ background: dominantColor }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
