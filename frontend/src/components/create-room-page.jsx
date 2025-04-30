"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Music } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function CreateRoomPage({
  votesToSkip = 2,
  guestCanPause = true,
  update = false,
  roomCode = null,
  updateCallback = () => {},
}) {
  const [guestCanPauseState, setGuestCanPauseState] = useState(guestCanPause)
  const [votesToSkipState, setVotesToSkipState] = useState(votesToSkip)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const router = useRouter()

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Creating room with settings:', {
        guestCanPause: guestCanPauseState,
        votesToSkip: votesToSkipState
      });
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_can_pause: guestCanPauseState,
          votes_to_skip: votesToSkipState,
        }),
        credentials: "include",
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create/`, requestOptions)

      if (response.ok) {
        const data = await response.json()
        console.log('Successfully created room:', data);
        router.push(`/room/${data.code}`)
      } else {
        console.error('Failed to create room:', response.status, response.statusText);
        toast.error("Failed to create room. Please try again.")
      }
    } catch (error) {
      console.error("Error creating room:", error)
      toast.error("Failed to create room. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRoom = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const requestOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_can_pause: guestCanPauseState,
          votes_to_skip: votesToSkipState,
          code: roomCode,
        }),
        credentials: "include",
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update/`, requestOptions)

      if (response.ok) {
        setSuccessMsg("Room updated successfully!")
        toast.success("Room updated successfully!")
        updateCallback()

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMsg(""), 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update room. Please try again.")
      }
    } catch (error) {
      console.error("Error updating room:", error)
      toast.error("Failed to update room. Please try again.")
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
              {update ? "UPDATE ROOM" : "CREATE A ROOM"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 border-none text-white">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMsg}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={update ? handleUpdateRoom : handleCreateRoom} className="space-y-8">
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label className="text-white text-lg font-medium">Guest Control</Label>
                <RadioGroup
                  defaultValue={guestCanPauseState ? "true" : "false"}
                  onValueChange={(value) => setGuestCanPauseState(value === "true")}
                  className="flex justify-center space-x-8"
                >
                  <div className="flex flex-col items-center space-y-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                    <RadioGroupItem value="true" id="play-pause" className="h-5 w-5" />
                    <Label htmlFor="play-pause" className="text-white font-medium">
                      Play/Pause
                    </Label>
                  </div>
                  <div className="flex flex-col items-center space-y-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                    <RadioGroupItem value="false" id="no-control" className="h-5 w-5" />
                    <Label htmlFor="no-control" className="text-white font-medium">
                      No Control
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="votes" className="text-white text-lg font-medium">
                  Votes to Skip
                </Label>
                <Input
                  id="votes"
                  type="number"
                  min="1"
                  value={votesToSkipState}
                  onChange={(e) => setVotesToSkipState(Number(e.target.value))}
                  className="h-14 text-lg text-center bg-white/10 backdrop-blur-sm border-white/10 text-white rounded-xl focus:border-purple-400 transition-all duration-300"
                />
              </motion.div>

              <motion.div
                className="flex flex-col space-y-4 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-medium rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg shadow-pink-500/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>{update ? "Updating..." : "Creating..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 w-full">
                      <Music size={20} />
                      <span>{update ? "Update Room" : "Create Room"}</span>
                    </div>
                  )}
                </Button>

                {!update && (
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
                )}
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
