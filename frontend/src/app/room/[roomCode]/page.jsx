import Room from "@/components/room"

export default async function RoomPage({ params }) {
  const resolvedParams = await params;
  return <Room roomCode={resolvedParams.roomCode} />
}
