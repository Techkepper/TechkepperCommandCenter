import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  MainHeaderButtonsWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: "1 1 auto",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    rowGap: theme.spacing(1.25),
    marginLeft: "auto",
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.25),
    "& > *": {
      margin: 0,
    },
    "& .MuiFormControl-root": {
      flex: "0 1 180px",
      minWidth: 150,
    },
    "& .MuiTextField-root": {
      flex: "1 1 260px",
      minWidth: 260,
      maxWidth: 320,
    },
    "& .MuiOutlinedInput-root": {
      minHeight: 42,
      borderRadius: 12,
      backgroundColor:
        theme.palette.type === "dark"
          ? "rgba(255, 255, 255, 0.04)"
          : theme.palette.background.paper,
    },
    "& .MuiOutlinedInput-input, & .MuiSelect-select": {
      lineHeight: 1.25,
      paddingTop: 11,
      paddingBottom: 11,
    },
    "& .MuiInputLabel-outlined": {
      lineHeight: 1.2,
      padding: theme.spacing(0, 0.5),
      backgroundColor:
        theme.palette.type === "dark"
          ? theme.palette.background.default
          : theme.palette.background.paper,
    },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      marginLeft: 0,
      justifyContent: "stretch",
      "& .MuiFormControl-root, & .MuiTextField-root, & .MuiButton-root": {
        flex: "1 1 100%",
        maxWidth: "100%",
      },
    },
  },
}));

const MainHeaderButtonsWrapper = ({ children }) => {
  const classes = useStyles();

  return <div className={classes.MainHeaderButtonsWrapper}>{children}</div>;
};

export default MainHeaderButtonsWrapper;
