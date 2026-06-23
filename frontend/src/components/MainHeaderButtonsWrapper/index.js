import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
	MainHeaderButtonsWrapper: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		flex: "1 1 auto",
		flexWrap: "wrap",
		gap: theme.spacing(1),
		marginLeft: "auto",
		"& > *": {
			margin: 0,
		},
		"& .MuiTextField-root": {
			flex: "1 1 260px",
			minWidth: 260,
			maxWidth: 320,
		},
		"& .MuiOutlinedInput-root": {
			borderRadius: 12,
			backgroundColor:
				theme.palette.type === "dark"
					? "rgba(255, 255, 255, 0.04)"
					: theme.palette.background.paper,
		},
		[theme.breakpoints.down("xs")]: {
			width: "100%",
			marginLeft: 0,
			justifyContent: "stretch",
			"& .MuiTextField-root, & .MuiButton-root": {
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
