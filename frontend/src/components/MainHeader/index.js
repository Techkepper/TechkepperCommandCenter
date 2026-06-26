import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  contactsHeader: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    rowGap: theme.spacing(1.25),
    minHeight: 56,
    padding: theme.spacing(1, 0.75, 1.25, 0.75),
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      lineHeight: 1.25,
      paddingTop: 2,
    },
  },
}));

const MainHeader = ({ children }) => {
  const classes = useStyles();

  return <div className={classes.contactsHeader}>{children}</div>;
};

export default MainHeader;
