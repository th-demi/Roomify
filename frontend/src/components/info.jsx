"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, SendToBackIcon as BackIcon, Music, Users } from "lucide-react"
import { motion } from "framer-motion"

const PAGES = {
  JOIN: "pages.join",
  CREATE: "pages.create",
}

export default function Info() {
  const [page, setPage] = useState(PAGES.JOIN)

  const joinInfo = () =>
    "Enter a room code to join an existing session and enjoy music with others. You'll be able to see what's playing and interact based on the room settings."

  const createInfo = () =>
    "Create a new room, share the code with friends, and manage playback together. As a host, you can set permissions and control how many votes are needed to skip songs."

  const handlePageToggle = () => {
    setPage((prevPage) => (prevPage === PAGES.CREATE ? PAGES.JOIN : PAGES.CREATE))
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
              What is Roomify?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
            <motion.div
              className="text-center space-y-6"
              key={page}
              initial={{ opacity: 0, x: page === PAGES.JOIN ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: page === PAGES.JOIN ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center">
                {page === PAGES.JOIN ? (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Users size={32} className="text-white" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <Music size={32} className="text-white" />
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-semibold text-white font-montserrat">
                {page === PAGES.JOIN ? "Join a Room" : "Create a Room"}
              </h3>

              <p className="text-white/90 text-lg leading-relaxed">{page === PAGES.JOIN ? joinInfo() : createInfo()}</p>
            </motion.div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handlePageToggle}
                className="text-white hover:bg-white/10 rounded-xl px-6 py-2 transition-all duration-300"
              >
                {page === PAGES.CREATE ? (
                  <div className="flex items-center gap-2">
                    <ArrowLeft size={18} />
                    <span>Previous</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Next</span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </Button>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full h-14 text-lg font-medium rounded-xl bg-white/10 border-none text-white hover:bg-white/20 transition-all duration-300"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <BackIcon size={18} />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
