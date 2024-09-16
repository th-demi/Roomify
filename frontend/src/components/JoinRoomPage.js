import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Grid, TextField, Typography } from "@mui/material";

const JoinRoomPage = () => {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoinRoomButtonClicked = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: roomCode }),
    };

    const response = await fetch("/api/join", requestOptions);
    if (response.ok) {
      navigate(`/room/${roomCode}`);
    } else {
      setError("Room not found.");
    }
  };

  return (
    <Grid container spacing={1} align="center">
      <Grid item xs={12}>
        <Typography variant="h4" component="h4" sx={{ color: 'white', textTransform: 'uppercase', }}>Join a Room</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          error={Boolean(error)}
          label="Code"
          placeholder="Enter a Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          helperText={error}
          variant="outlined"
          sx={{input: { color: 'white',}, label: { color: 'white',},}}
        />
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={handleJoinRoomButtonClicked}>Join</Button>
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="secondary" to="/" component={Link}>Back</Button>
      </Grid>
    </Grid>
  );
};

export default JoinRoomPage;