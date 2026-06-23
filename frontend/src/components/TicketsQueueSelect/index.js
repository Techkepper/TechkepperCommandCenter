import React from "react";

import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { Checkbox, ListItemText } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

const TicketsQueueSelect = ({
	userQueues,
	queues,
	selectedQueueIds = [],
	onChange,
	style,
}) => {
	const availableQueues = queues || userQueues || [];

	const handleChange = e => {
		const values = e.target.value;
		if (values.includes("__all__")) {
			onChange([]);
			return;
		}
		onChange(values);
	};

	const renderSelectedQueues = () => {
		if (!selectedQueueIds.length) {
			return i18n.t("ticketsQueueSelect.all");
		}
		if (selectedQueueIds.length === 1) {
			const queue = availableQueues.find(q => q.id === selectedQueueIds[0]);
			return queue?.name || i18n.t("ticketsQueueSelect.placeholder");
		}
		return i18n.t("ticketsQueueSelect.selected", {
			count: selectedQueueIds.length,
		});
	};

	return (
		<div style={{ width: 170, marginTop: -4, ...style }}>
			<FormControl fullWidth margin="dense">
				<Select
					multiple
					displayEmpty
					variant="outlined"
					value={selectedQueueIds}
					onChange={handleChange}
					MenuProps={{
						anchorOrigin: {
							vertical: "bottom",
							horizontal: "left",
						},
						transformOrigin: {
							vertical: "top",
							horizontal: "left",
						},
						getContentAnchorEl: null,
					}}
					renderValue={renderSelectedQueues}
				>
					<MenuItem dense value="__all__">
						<Checkbox
							size="small"
							color="primary"
							checked={selectedQueueIds.length === 0}
						/>
						<ListItemText primary={i18n.t("ticketsQueueSelect.all")} />
					</MenuItem>
					{availableQueues.length > 0 &&
						availableQueues.map(queue => (
							<MenuItem dense key={queue.id} value={queue.id}>
								<Checkbox
									style={{
										color: queue.color,
									}}
									size="small"
									color="primary"
									checked={selectedQueueIds.indexOf(queue.id) > -1}
								/>
								<ListItemText primary={queue.name} />
							</MenuItem>
						))}
				</Select>
			</FormControl>
		</div>
	);
};

export default TicketsQueueSelect;
