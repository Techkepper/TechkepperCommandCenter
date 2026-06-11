import React, { useEffect } from 'react';
import toastError from "../../errors/toastError";

import Typography from "@material-ui/core/Typography";

import { Button, Divider, } from "@material-ui/core";

const LocationPreview = ({ image, link, description }) => {
    useEffect(() => {}, [image, link, description]);

    const getSafeLink = () => {
        try {
            const parsed = new URL(link);
            return parsed.protocol === "https:" ? parsed.toString() : "";
        } catch (_err) {
            return "";
        }
    };

    const handleLocation = async() => {
        try {
            const safeLink = getSafeLink();
            if (safeLink) {
                window.open(safeLink, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            toastError(err);
        }
    }

    return (
		<>
			<div style={{
				minWidth: "250px",
			}}>
				<div>
					<div style={{ float: "left" }}>
						{image && (
							<img
								src={image}
								alt="Ubicacion compartida"
								onClick={handleLocation}
								style={{ width: "100px" }}
							/>
						)}
					</div>
					{ description && (
					<div style={{ display: "flex", flexWrap: "wrap" }}>
						<Typography style={{ marginTop: "12px", marginLeft: "15px", marginRight: "15px", float: "left" }} variant="subtitle1" color="primary" gutterBottom>
							<div style={{ whiteSpace: "pre-line" }}>
								{description.replace(/\\n/g, "\n")}
							</div>
						</Typography>
					</div>
					)}
					<div style={{ display: "block", content: "", clear: "both" }}></div>
					<div>
						<Divider />
						<Button
							fullWidth
							color="primary"
							onClick={handleLocation}
							disabled={!getSafeLink()}
						>Visualizar</Button>
					</div>
				</div>
			</div>
		</>
	);

};

export default LocationPreview;
