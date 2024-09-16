import React from "react";
import { Grid, Card, Typography, IconButton, LinearProgress } from "@mui/material";
import { PlayArrow, SkipNext, Pause } from "@mui/icons-material";

const Player = ({ song }) => {
  const songProgress = (song.time / song.duration) * 100; // Calculate song progress percentage

  const playSong = async () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };

    await fetch("/spotify/play", requestOptions); // No need to store response if not used
  };

  const pauseSong = async () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };

    await fetch("/spotify/pause", requestOptions); // No need to store response if not used
  };

  const skipSong = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    await fetch("/spotify/skip", requestOptions); // No need to store response if not used
  };

  return (
    <Card sx={{ width: 300, height: 'auto', display: 'flex', flexDirection: 'column', padding: 2 }}>
      <Grid container direction="column" alignItems="center">
        <Grid item>
          <img src={song.image_url} height="200" width="200" alt="Album Cover" />
        </Grid>
        <Grid item>
          <Typography component="h5" variant="h5">
            {song.title}
          </Typography>
          <Typography color="textSecondary" variant="subtitle1">
            {song.artist}
          </Typography>
        </Grid>
        <Grid item>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={song.is_playing ? pauseSong : playSong}>
              {song.is_playing ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton onClick={skipSong}>
              <SkipNext />
            </IconButton>
            <Typography>{song.total_votes}/{song.votes_required_to_skip}</Typography>
          </div>
        </Grid>
        <Grid item sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={songProgress} sx={{ height: 10 }} />
        </Grid>

      </Grid>
    </Card>
  );
};

export default Player;
