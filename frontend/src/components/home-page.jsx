"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Users, InfoIcon } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  const [roomCode, setRoomCode] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchRoomCode = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inroom/`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.code) {
            setRoomCode(data.code)
          }
        }
      } catch (error) {
        console.error("Failed to fetch room code:", error)
      }
    }

    fetchRoomCode()
  }, [])

  useEffect(() => {
    if (roomCode) {
      router.push(`/room/${roomCode}`)
    }
  }, [roomCode, router])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
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
          <CardContent className="p-8">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center space-y-8"
            >
              <motion.div variants={item} className="relative">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 tracking-tight font-montserrat">
                  ROOMIFY
                </h1>
                <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
              </motion.div>

              <motion.div variants={item} className="w-full space-y-4">
                <Button
                  asChild
                  className="w-full h-14 text-lg font-medium rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/20"
                >
                  <Link href="/join" className="flex items-center justify-center gap-3">
                    <Users size={22} />
                    Join a Room
                  </Link>
                </Button>

                <Button
                  asChild
                  className="w-full h-14 text-lg font-medium rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg shadow-pink-500/20"
                >
                  <Link href="/create" className="flex items-center justify-center gap-3">
                    <Music size={22} />
                    Create a Room
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full h-14 text-lg font-medium rounded-xl text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  <Link href="/info" className="flex items-center justify-center gap-3">
                    <InfoIcon size={22} />
                    Info
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
