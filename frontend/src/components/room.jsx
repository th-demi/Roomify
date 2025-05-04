"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, LogOut } from "lucide-react"
import MusicPlayer from "@/components/music-player"
import CreateRoomPage from "@/components/create-room-page"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function Room({ roomCode }) {
  const router = useRouter()
  const [viewSettings, setViewSettings] = useState(false)
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false)
  const [song, setSong] = useState({})
  const [roomDetails, setRoomDetails] = useState({
    votesToSkip: 2,
    guestCanPause: false,
    isHost: false,
  })
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const getRoomDetails = async () => {
      try {
        console.log('Fetching room details for code:', roomCode);
        
        // First, ensure we have a valid session
        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inroom/`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!sessionResponse.ok) {
          console.error('Failed to get session:', sessionResponse.status, sessionResponse.statusText);
          return;
        }

        const sessionData = await sessionResponse.json();
        console.log('Session data:', sessionData);

        // If we're already in a room, verify it's the same room
        if (sessionData.code && sessionData.code !== roomCode) {
          console.log('Already in a different room, leaving first...');
          await leaveRoom();
        }

        // Join the room
        const joinResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/join/`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: roomCode }),
        });

        if (!joinResponse.ok) {
          console.error('Failed to join room:', joinResponse.status, joinResponse.statusText);
          leaveRoom();
          return;
        }

        const joinData = await joinResponse.json();
        console.log('Join response:', joinData);

        // Get room details
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/?code=${roomCode}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          console.error('Failed to get room details:', response.status, response.statusText);
          leaveRoom();
          return;
        }

        const data = await response.json();
        console.log('Received room details:', data);
        setRoomDetails({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
        setIsHost(data.is_host);

        if (data.is_host) {
          authenticateSpotify();
        }
      } catch (error) {
        console.error("Failed to get room details:", error);
        leaveRoom();
      } finally {
        setLoading(false);
      }
    };

    getRoomDetails();
  }, [roomCode]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "userLeftRoom") {
        router.push("/")
        localStorage.removeItem("userLeftRoom")
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [router])

  const authenticateSpotify = async () => {
    try {
      console.log('Checking Spotify authentication status');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/is-authenticated/`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      console.log('Spotify authentication status:', data);
      setSpotifyAuthenticated(data.status)

      if (!data.status) {
        console.log('Initiating Spotify authentication');
        const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/get-auth-url/`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        const authData = await authResponse.json()
        console.log('Received Spotify auth URL:', authData);
        localStorage.setItem("spotifyAuthRedirect", roomCode)
        window.location.replace(authData.url)
      }
    } catch (error) {
      console.error("Failed to authenticate Spotify:", error)
      toast.error("Spotify Authentication Failed. Please try again later")
    }
  }

  useEffect(() => {
    const getCurrentSong = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/current-song/`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (response.status === 204) {
          console.log("No song playing")
          setSong({})
          return
        }

        const data = await response.json()
        
        if (response.status === 404 && data.error === "Not in a room") {
          console.log("Not in a room, refreshing session...")
          // Try to refresh the session
          const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inroom/`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!sessionResponse.ok) {
            console.error('Failed to refresh session:', sessionResponse.status, sessionResponse.statusText);
            return;
          }
          
          // Retry getting current song
          const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/current-song/`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setSong(retryData);
            return;
          }
        }
        
        if (data.host_authenticated === false) {
          console.log("Host is not authenticated with Spotify")
          setSong({
            title: "Waiting for host",
            artist: "Host needs to connect to Spotify",
            image_url: "/placeholder.svg?height=300&width=300",
            is_playing: false,
          })
          return
        }

        if (response.ok) {
          setSong(data)
        }
      } catch (error) {
        console.error("Failed to get current song:", error)
        setSong({
          title: "Connection error",
          artist: "Please check your connection",
          image_url: "/placeholder.svg?height=300&width=300",
          is_playing: false,
        })
      }
    }

    // Only authenticate Spotify for host
    if (isHost && !spotifyAuthenticated) {
      authenticateSpotify()
    }
    
    // For all users (host and guests), start fetching current song
    getCurrentSong()
    const interval = setInterval(getCurrentSong, 5000)
    return () => clearInterval(interval)
  }, [isHost, spotifyAuthenticated])

  const leaveRoom = async () => {
    try {
      localStorage.setItem("userLeftRoom", "true")
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      router.push("/")
    } catch (error) {
      console.error("Failed to leave room:", error)
      router.push("/")
    }
  }

  const updateRoomDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/?code=${roomCode}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        setRoomDetails({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        })
        setIsHost(data.is_host)
        setViewSettings(false)
      }
    } catch (error) {
      console.error("Failed to update room details:", error)
    }
  }

  const checkSessionAndJoinRoom = async () => {
    try {
      // First check if we're already in a room
      const inRoomResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inroom/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const inRoomData = await inRoomResponse.json();
      console.log('InRoom response:', inRoomData);

      if (inRoomData.code) {
        // We're already in a room, fetch its details
        const roomResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/room/${inRoomData.code}/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoomDetails(roomData);
          setIsHost(roomData.is_host);
          setLoading(false);
          return;
        }
      }

      // If we're not in a room, try to join
      const joinResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/join/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: roomCode,
          name: guestName,
        }),
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      const joinData = await joinResponse.json();
      console.log('Join response:', joinData);

      // After joining, get the room details
      const roomResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/room/${roomCode}/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!roomResponse.ok) {
        throw new Error('Failed to fetch room details');
      }

      const roomData = await roomResponse.json();
      setRoomDetails(roomData);
      setIsHost(roomData.is_host);
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (viewSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <CreateRoomPage
          update={true}
          votesToSkip={roomDetails.votesToSkip}
          guestCanPause={roomDetails.guestCanPause}
          roomCode={roomCode}
          updateCallback={updateRoomDetails}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center h-[100dvh] p-4 animated-bg room-${roomCode} overflow-hidden`}>
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
        <Card className="glass-dark border-none shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-full flex justify-between items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white font-montserrat">Room</h2>
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <code className="text-white/90 font-mono">{roomCode}</code>
                    </div>
                  </div>
                </motion.div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={leaveRoom}
                  className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                >
                  <LogOut size={18} />
                </Button>
              </div>

              <MusicPlayer song={song} roomCode={roomCode} />

              {roomDetails.isHost && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
                >
                  <Button
                    onClick={() => setViewSettings(true)}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300"
                    variant="outline"
                  >
                    <Settings size={18} />
                    Room Settings
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
