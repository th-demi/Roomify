import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Grid, Typography, TextField, FormHelperText, FormControl, FormControlLabel, Radio, RadioGroup, Collapse } from "@mui/material";

// Functional component with default parameter values
const CreateRoomPage = ({
  votesToSkip = 2,
  guestCanPause = true,
  update = false,
  roomCode = null,
  updateCallback = () => {}
}) => {
  const [guestCanPauseState, setGuestCanPauseState] = useState(guestCanPause);
  const [votesToSkipState, setVotesToSkipState] = useState(votesToSkip);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleVotesChange = (e) => {
    setVotesToSkipState(Number(e.target.value));
  };

  const handleGuestCanPauseChange = (e) => {
    setGuestCanPauseState(e.target.value === "true");
  };

  const handleCreateRoomButtonClicked = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest_can_pause: guestCanPauseState,
        votes_to_skip: votesToSkipState,
      }),
    };

    const response = await fetch("/api/create", requestOptions);
    const data = await response.json();
    navigate(`/room/${data.code}`);
  };
  
  const handleUpdateRoomButtonClicked = async () => {
    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest_can_pause: guestCanPauseState,
        votes_to_skip: votesToSkipState,
        code : roomCode,
      }),
    };

    const response = await fetch("/api/update", requestOptions);
    if (response.ok){
      setSuccessMsg("Room created successfully!");
      updateCallback();
    }else{
      setErrorMsg("Failed to update room.");
    }
  };

  const renderCreateRoomButton = () => {
    return(
      <Grid container spacing={1} align="center">
        <Grid item xs={12} align="center">
          <Button color="primary" variant="contained" onClick={handleCreateRoomButtonClicked}>Create Room</Button>
        </Grid>
        <Grid item xs={12} align="center">
          <Button color="secondary" variant="contained" to="/" component={Link}>Back</Button>
        </Grid>
      </Grid>
    )
  }

  const renderUpdateRoomButton = () => {
    return(
      <Grid container spacing={1} align="center">
        <Grid item xs={12} align="center">
          <Button color="primary" variant="contained" onClick={handleUpdateRoomButtonClicked}>Update Room</Button>
        </Grid>
      </Grid>
    )
  }

  const title = update ? "Update Room" : "Create a Room";

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <Collapse in={errorMsg != "" || successMsg != ""}>{successMsg}</Collapse>
        <Typography component="h4" variant="h4">{title}</Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <FormControl>
          <RadioGroup row value={guestCanPauseState.toString()} onChange={handleGuestCanPauseChange}>
            <FormControlLabel
              value="true"
              control={<Radio color="primary" />}
              label="Play/Pause"
              labelPlacement="bottom"
            />
            <FormControlLabel
              value="false"
              control={<Radio color="secondary" />}
              label="No control"
              labelPlacement="bottom"
            />
          </RadioGroup>
          <FormHelperText>
            <span style={{ textAlign: "center" }}>Guest control of playback state</span>
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid item xs={12} align="center">
        <FormControl>
          <TextField
            required
            type="number"
            value={votesToSkipState}
            onChange={handleVotesChange}
            inputProps={{ min: 1, style: { textAlign: "center" } }}
          />
          <FormHelperText>
            <span style={{ textAlign: "center" }}>Votes required to skip song</span>
          </FormHelperText>
        </FormControl>
      </Grid>
      {update ? renderUpdateRoomButton() : renderCreateRoomButton()}
    </Grid>
  );
};

export default CreateRoomPage;