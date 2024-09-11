import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button, Typography } from "@mui/material";
import CreateRoomPage from "./CreateRoomPage";

const Room = ({ leaveRoomCallback }) => {
  const { roomCode } = useParams(); // gets roomCode from the URL
  const navigate = useNavigate();
  const [viewSettings , setViewSettings] = useState(false);
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
  };
  
  useEffect(() => {
    getRoomDetails();
  }, [roomCode, navigate, leaveRoomCallback]);

  const leaveRoom = () => {
    localStorage.setItem('userLeftRoom', 'true'); // creates a variable named userLeftRoom in browser's storage and set it to True
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    fetch("/api/leave", requestOptions).then((response) => {
      if (response.ok) {
        leaveRoomCallback(); // Call the callback to clear the room code
        navigate("/"); // Redirect to the homepage
      }
    });
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.storageArea === localStorage && event.key === 'userLeftRoom') { // checks if the event was triggered by localStorage changes and if the key that was changed is 'userLeftRoom'.
        leaveRoomCallback();
        localStorage.removeItem('userLeftRoom');
        navigate("/");
      }
    };
    window.addEventListener('storage', handleStorageChange); // Add an event listener to storage(local,session,..)
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [leaveRoomCallback, navigate]);

  const showSettingsButton = () => {
    return(
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={settingsButtonClicked}>Settings</Button>
      </Grid>
    )
  }

  const settingsButtonClicked = () => {
    setViewSettings(true);
  }

  const renderSettings = () => {
    return(
      <Grid container spacing={1} align="center">
      <Grid item xs={12}>
        <CreateRoomPage update={true} votesToSkip={state.votesToSkip} guestCanPause={state.guestCanPause} roomCode={roomCode} updateCallback={getRoomDetails}></CreateRoomPage>
      </Grid>
      <Grid item xs={12}>
        <Button color="secondary" variant="contained"  onClick={() => setViewSettings(false)}>Close</Button>
      </Grid>
    </Grid>
    )
  }

  return viewSettings ? renderSettings() : (
    <Grid container spacing={1} align="center">
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">Code: {roomCode}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">Votes to Skip: {state.votesToSkip}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">Guest Can Pause: {state.guestCanPause.toString()}</Typography>
      </Grid>
      <Grid item xs={12}><Typography variant="h6" component="h6">Is Host: {state.isHost.toString()}</Typography>
      </Grid>
      {state.isHost && showSettingsButton()}
      <Grid item xs={12}>
        <Button variant="contained" color="secondary" onClick={leaveRoom}>Leave Room</Button>
      </Grid>
    </Grid>
  );
};

export default Room;