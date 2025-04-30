"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Direct API URL (assuming it's defined in an environment variable)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://your-backend-api.com"

  const handleJoinRoom = async (e) => {
    e.preventDefault()

    if (!roomCode.trim()) {
      toast.error("Please enter a room code")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/join/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode }),
        credentials: "include",
      })

      if (response.ok) {
        router.push(`/room/${roomCode}`)
      } else {
        toast.error("Room not found. Please check the room code and try again")
      }
    } catch (error) {
      toast.error("Failed to join room. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 animated-bg">
      <div className="blob bg-purple-500"></div>
      <div className="blob bg-pink-500"></div>
      <div className="blob bg-blue-500"></div>
      <div className="blob bg-indigo-500"></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-black/40 backdrop-blur-md border-none shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 font-montserrat">
              JOIN A ROOM
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleJoinRoom} className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="h-14 text-lg bg-white/10 backdrop-blur-sm border-white/10 text-white placeholder:text-white/70 rounded-xl focus:border-purple-400 transition-all duration-300"
                />
              </motion.div>

              <motion.div
                className="flex flex-col space-y-4 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-medium rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Joining...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 w-full">
                      <Users size={20} />
                      <span>Join Room</span>
                    </div>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-14 text-lg font-medium rounded-xl bg-white/10 border-none text-white hover:bg-white/20 transition-all duration-300"
                >
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <ArrowLeft size={18} />
                    Back
                  </Link>
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
