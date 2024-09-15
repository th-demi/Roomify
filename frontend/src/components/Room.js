import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button, Typography } from "@mui/material";
import CreateRoomPage from "./CreateRoomPage";
import Player from "./MusicPlayer";

const Room = ({ leaveRoomCallback }) => {
  const { roomCode } = useParams(); // gets roomCode from the URL
  const navigate = useNavigate();
  const [viewSettings, setViewSettings] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [Song, setSong] = useState({});
  const [state, setState] = useState({
    votesToSkip: 2,
    guestCanPause: false,
    isHost: false,
  });

  const getRoomDetails = async () => {
    const response = await fetch(`/api/get?code=${roomCode}`);
    if (!response.ok) {
      leaveRoomCallback(); // Call the callback to clear the room code
      navigate("/"); // Redirect to the homepage if the room doesn't exist
      return;
    }
    const data = await response.json();
    setState({
      votesToSkip: data.votes_to_skip,
      guestCanPause: data.guest_can_pause,
      isHost: data.is_host,
    });
    if (data.is_host) {
      authenticateSpotify(); // If the user is the host, authenticate Spotify
    }
  };

  useEffect(() => {
    getRoomDetails();
    getCurrentSong(); // Fetch the current song details when the component mounts
    const interval = setInterval(getCurrentSong, 1000); // Set up an interval to fetch the current song every 1000ms
    return () => clearInterval(interval); // Cleanup function to clear the interval when the component unmounts
  }, [roomCode, navigate, leaveRoomCallback]);

  const leaveRoom = async () => {
    localStorage.setItem("userLeftRoom", "true"); // Set a flag in localStorage
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    const response = await fetch("/api/leave", requestOptions);
    if (response.ok) {
      leaveRoomCallback(); // Clear the room code
      navigate("/"); // Navigate to the homepage
    }
  };

  const authenticateSpotify = async () => {
    const response = await fetch("/spotify/is-authenticated");
    const data = await response.json();
    console.log(data.status);
    setSpotifyAuthenticated(data.status);

    if (!data.status) {
      const authResponse = await fetch("/spotify/get-auth-url");
      const authData = await authResponse.json();
      console.log(authData.url);
      window.location.replace(authData.url); // Redirect to Spotify authentication URL
    }
  };

  const getCurrentSong = async () => {
    const response = await fetch("/spotify/current-song");
    const data = response.ok ? await response.json() : {};
    console.log(data);
    setSong(data); // Set the current song in the state
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.storageArea === localStorage && event.key === "userLeftRoom") {
        // checks if the event was triggered by localStorage changes and if the key that was changed is 'userLeftRoom'.
        leaveRoomCallback();
        localStorage.removeItem("userLeftRoom"); // Remove the localStorage key after handling
        navigate("/");
      }
    };
    window.addEventListener("storage", handleStorageChange); // Add an event listener to storage(local,session,..)
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [leaveRoomCallback, navigate]);

  const showSettingsButton = () => (
    <Grid item xs={12}>
      <Button variant="contained" color="primary" onClick={settingsButtonClicked}>
        Settings
      </Button>
    </Grid>
  );

  const settingsButtonClicked = () => {
    setViewSettings(true); // Set the view to show settings
  };

  const renderSettings = () => (
    <Grid container spacing={1} align="center">
      <Grid item xs={12}>
        <CreateRoomPage
          update={true}
          votesToSkip={state.votesToSkip}
          guestCanPause={state.guestCanPause}
          roomCode={roomCode}
          updateCallback={getRoomDetails}
        />
      </Grid>
      <Grid item xs={12}>
        <Button color="secondary" variant="contained" onClick={() => setViewSettings(false)}>
          Close
        </Button>
      </Grid>
    </Grid>
  );

  return viewSettings ? (
    renderSettings() // If viewSettings is true, show the settings page
  ) : (
    <Grid container spacing={1} align="center" justifyContent="center" alignItems="center">
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">
          Code: {roomCode} {/* Display room code */}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Player song={Song} />
      </Grid>
      {state.isHost && showSettingsButton()} {/* Show settings button if the user is the host */}
      <Grid item xs={12}>
        <Button variant="contained" color="secondary" onClick={leaveRoom}>
          Leave Room
        </Button>
      </Grid>
    </Grid>
  );
};

export default Room;
