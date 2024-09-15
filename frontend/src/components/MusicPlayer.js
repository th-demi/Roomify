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
    <Card>
      <Grid container alignItems="center">
        <Grid item align="center" xs={4}>
          <img src={song.image_url} height="100%" width="100%" alt="Album Cover" />
        </Grid>
        <Grid item align="center" xs={8}>
          <Typography component="h5" variant="h5">
            {song.title}
          </Typography>
          <Typography color="textSecondary" variant="subtitle1">
            {song.artist}
          </Typography>
          <div>
            <IconButton onClick={song.is_playing ? pauseSong : playSong}>
              {song.is_playing ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton onClick={skipSong}>
              <SkipNext />
            </IconButton>
            <Typography>{song.total_votes}/{song.votes_required_to_skip}</Typography>
          </div>
        </Grid>
      </Grid>
      <LinearProgress variant="determinate" value={songProgress} />
    </Card>
  );
};

export default Player;