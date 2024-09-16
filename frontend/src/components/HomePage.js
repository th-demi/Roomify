import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate} from "react-router-dom";
import { Button, Grid, ButtonGroup, Typography } from "@mui/material";
import CreateRoomPage from "./CreateRoomPage";
import JoinRoomPage from "./JoinRoomPage";
import Room from "./Room";
import Info from "./Info";

const HomePage = () => {
  const [roomCode, setRoomCode] = useState(null);

  useEffect(() => {
    const fetchRoomCode = async () => {
      const response = await fetch("/api/inroom");
      const data = await response.json();
      setRoomCode(data.code);
    };
    fetchRoomCode();
  }, []); // Empty dependency array means this effect runs once on mount

  const clearRoomCode = () => {
    setRoomCode(null);
  };

  const renderHomePage = () => {
    return (
      <Grid container spacing={3} align="center">
        <Grid item xs={12}>
          <Typography variant="h3" component="h3" sx={{ color: 'white', textTransform: 'uppercase', }}>Roomify</Typography>
        </Grid>
        <Grid item xs={12}>
            <Button color="primary" variant="contained" to='/join' component={Link}>Join a Room</Button>
        </Grid>
        <Grid item xs={12}>
            <Button color="secondary" variant="contained" to='/create' component={Link}>Create a Room</Button>
        </Grid>
        <Grid item xs={12}>
            <Button color="success" to='/info' component={Link} sx={{ color: 'white'}}>Info</Button>
        </Grid>
      </Grid>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={roomCode ? <Navigate to={`/room/${roomCode}`} /> : renderHomePage()} />
        <Route path="/join" element={<JoinRoomPage />} />
        <Route path="/info" element={<Info />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/room/:roomCode" element={<Room leaveRoomCallback={clearRoomCode} />} />
      </Routes>
    </Router>
  );
};

export default HomePage;