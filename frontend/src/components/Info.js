import React, { useState, useEffect } from 'react';
import { Grid, Button, Typography, IconButton } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link } from 'react-router-dom';

const PAGES = {
  JOIN: 'pages.join',
  CREATE: 'pages.create',
};

const Info = () => {
  const [page, setPage] = useState(PAGES.JOIN);

  const joinInfo = () => 'Join page';
  const createInfo = () => 'Create page';

  const handlePageToggle = () => {
    setPage(prevPage => (prevPage === PAGES.CREATE ? PAGES.JOIN : PAGES.CREATE));
  };

  return (
    <Grid container spacing={1} alignItems="center" justifyContent="center">
      <Grid item xs={12}>
        <Typography component="h4" variant="h4" align="center">
          What is House Party?
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1" align="center">
          {page === PAGES.JOIN ? joinInfo() : createInfo()}
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <IconButton onClick={handlePageToggle} aria-label="Toggle page">
          {page === PAGES.CREATE ? <NavigateBeforeIcon /> : <NavigateNextIcon />}
        </IconButton>
      </Grid>
      <Grid item xs={12} align="center">
        <Button color="secondary" variant="contained" component={Link} to="/">
          Back
        </Button>
      </Grid>
    </Grid>
  );
};

export default Info;
