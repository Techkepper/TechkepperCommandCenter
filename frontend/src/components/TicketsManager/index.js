import React, { useContext, useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsList";
import TabPanel from "../TabPanel";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { Button, FormControl, MenuItem, Select } from "@material-ui/core";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
  },
  tabsHeader: {
    flex: "none",
    backgroundColor: theme.palette.background.paper,
  },
  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
  },
  tab: {
    minWidth: 120,
    width: 120,
  },
  ticketOptionsBox: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1.25),
    background: theme.palette.background.paper,
    padding: theme.spacing(1, 1.25),
    overflow: "visible",
    [theme.breakpoints.down("sm")]: {
      alignItems: "stretch",
      gap: theme.spacing(1),
    },
  },
  primaryActions: {
    display: "flex",
    alignItems: "center",
    flex: "0 0 auto",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    minWidth: 0,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  newTicketButton: {
    flexShrink: 0,
    minWidth: 176,
    whiteSpace: "nowrap",
    [theme.breakpoints.down("xs")]: {
      flex: "1 1 100%",
      minWidth: 0,
    },
  },
  showAllControl: {
    flexShrink: 0,
    marginLeft: 0,
    marginRight: 0,
    whiteSpace: "nowrap",
  },
  filtersBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: "1 1 320px",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    minWidth: 0,
    marginLeft: "auto",
    [theme.breakpoints.down("sm")]: {
      justifyContent: "flex-start",
      marginLeft: 0,
      width: "100%",
    },
  },
  queueSelectWrapper: {
    flex: "1 1 190px",
    minWidth: 190,
    maxWidth: 260,
    [theme.breakpoints.down("xs")]: {
      maxWidth: "100%",
    },
  },
  ecosystemSelect: {
    flex: "1 1 190px",
    minWidth: 190,
    maxWidth: 260,
    marginTop: 0,
    [theme.breakpoints.down("xs")]: {
      maxWidth: "100%",
    },
  },
  filterSelect: {
    width: "100%",
  },
  serachInputWrapper: {
    flex: "1 1 280px",
    minWidth: 220,
    maxWidth: 520,
    background: theme.palette.background.default,
    display: "flex",
    alignItems: "center",
    borderRadius: 40,
    border: `1px solid ${theme.palette.divider}`,
    minHeight: 40,
    padding: 4,
    [theme.breakpoints.down("xs")]: {
      flexBasis: "100%",
      maxWidth: "100%",
      minWidth: 0,
    },
  },
  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },
  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
    color: theme.palette.text.primary, 
    backgroundColor: theme.palette.background.default,
  },
  tabLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.75),
  },
  tabCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 20,
    padding: "0 6px",
    borderRadius: 10,
    fontSize: "0.75rem",
    fontWeight: 600,
    lineHeight: 1,
    color: "#fff",
  },
  tabCountPrimary: {
    backgroundColor: theme.palette.primary.main,
  },
  tabCountSecondary: {
    backgroundColor: theme.palette.secondary.main,
  },
  show: {
    display: "block",
  },
  hide: {
    display: "none !important",
  },
}));

const TicketsManager = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.profile?.toUpperCase() === "ADMIN";
  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(Boolean(isAdmin));
  const searchInputRef = useRef();
  const searchTimeoutRef = useRef();
  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [availableQueues, setAvailableQueues] = useState(user?.queues || []);
  const [ecosystems, setEcosystems] = useState([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [selectedEcosystemId, setSelectedEcosystemId] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      try {
        const [{ data: queues }, { data: ecosystemOptions }] = await Promise.all([
          api.get("/queue"),
          api.get("/ecosystems"),
        ]);

        if (!isMounted) return;

        setAvailableQueues(queues);
        setEcosystems(ecosystemOptions);
        setSelectedQueueIds(prev =>
          prev.filter(queueId => queues.some(queue => queue.id === queueId))
        );
        setSelectedEcosystemId(prev =>
          prev && ecosystemOptions.some(ecosystem => ecosystem.id === Number(prev))
            ? prev
            : ""
        );
      } catch (err) {
        if (isMounted) {
          setAvailableQueues(user?.queues || []);
        }
      }
    };

    loadFilters();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.queues]);

  useEffect(() => {
    setShowAllTickets(Boolean(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current?.focus();
    }
  }, [tab]);

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeoutRef.current);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      setTab("open");
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={() => setNewTicketModalOpen(false)}
      />
      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
        >
          <Tab
            value={"open"}
            icon={<MoveToInboxIcon />}
            label={i18n.t("tickets.tabs.open.title")}
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"closed"}
            icon={<CheckBoxIcon />}
            label={i18n.t("tickets.tabs.closed.title")}
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"search"}
            icon={<SearchIcon />}
            label={i18n.t("tickets.tabs.search.title")}
            classes={{ root: classes.tab }}
          />
        </Tabs>
      </Paper>
      <Paper square elevation={0} className={classes.ticketOptionsBox}>
        {tab === "search" ? (
          <div className={classes.serachInputWrapper}>
            <SearchIcon className={classes.searchIcon} />
            <InputBase
              className={classes.searchInput}
              inputRef={searchInputRef}
              placeholder={i18n.t("tickets.search.placeholder")}
              type="search"
              defaultValue={searchParam}
              onChange={handleSearch}
            />
          </div>
        ) : (
          <div className={classes.primaryActions}>
            <Button
              variant="outlined"
              color="primary"
              className={classes.newTicketButton}
              onClick={() => setNewTicketModalOpen(true)}
            >
              {i18n.t("ticketsManager.buttons.newTicket")}
            </Button>
            <Can
              role={user.profile}
              perform="tickets-manager:showall"
              yes={() => (
                <FormControlLabel
                  className={classes.showAllControl}
                  label={i18n.t("tickets.buttons.showAll")}
                  labelPlacement="start"
                  control={
                    <Switch
                      size="small"
                      checked={showAllTickets}
                      onChange={() =>
                        setShowAllTickets((prevState) => !prevState)
                      }
                      name="showAllTickets"
                      color="primary"
                    />
                  }
                />
              )}
            />
          </div>
        )}
        <div className={classes.filtersBox}>
          <TicketsQueueSelect
            className={classes.queueSelectWrapper}
            selectedQueueIds={selectedQueueIds}
            queues={availableQueues}
            userQueues={user?.queues}
            onChange={(values) => setSelectedQueueIds(values)}
          />
          <FormControl
            variant="outlined"
            margin="dense"
            className={classes.ecosystemSelect}
          >
            <Select
              className={classes.filterSelect}
              displayEmpty
              value={selectedEcosystemId}
              onChange={(event) => setSelectedEcosystemId(event.target.value)}
              renderValue={(value) => {
                if (!value) return i18n.t("tickets.ecosystemFilter.all");
                const ecosystem = ecosystems.find(item => item.id === Number(value));
                return ecosystem?.name || i18n.t("tickets.ecosystemFilter.placeholder");
              }}
            >
              <MenuItem value="">
                {i18n.t("tickets.ecosystemFilter.all")}
              </MenuItem>
              {ecosystems.map(ecosystem => (
                <MenuItem key={ecosystem.id} value={ecosystem.id}>
                  {ecosystem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </Paper>
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            label={
              <span className={classes.tabLabel}>
                {i18n.t("ticketsList.assignedHeader")}
                {openCount > 0 && (
                  <span
                    className={`${classes.tabCount} ${classes.tabCountPrimary}`}
                  >
                    {openCount}
                  </span>
                )}
              </span>
            }
            value={"open"}
          />
          <Tab
            label={
              <span className={classes.tabLabel}>
                {i18n.t("ticketsList.pendingHeader")}
                {pendingCount > 0 && (
                  <span
                    className={`${classes.tabCount} ${classes.tabCountSecondary}`}
                  >
                    {pendingCount}
                  </span>
                )}
              </span>
            }
            value={"pending"}
          />
        </Tabs>
        <Paper className={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            ecosystemId={selectedEcosystemId}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
          />
          <TicketsList
            status="pending"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            ecosystemId={selectedEcosystemId}
            updateCount={(val) => setPendingCount(val)}
            style={applyPanelStyle("pending")}
          />
        </Paper>
      </TabPanel>
      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          ecosystemId={selectedEcosystemId}
        />
      </TabPanel>
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        <TicketsList
          searchParam={searchParam}
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          ecosystemId={selectedEcosystemId}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManager;
