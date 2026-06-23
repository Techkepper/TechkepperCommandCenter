import React, { useContext, useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
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
    justifyContent: "space-between",
    alignItems: "center",
    background: theme.palette.background.paper,
    padding: theme.spacing(1),
  },
  filtersBox: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
  ecosystemSelect: {
    minWidth: 150,
    marginTop: -4,
  },
  serachInputWrapper: {
    flex: 1,
    background: theme.palette.background.default,
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
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
  badge: {
    right: "-10px",
  },
  show: {
    display: "block",
  },
  hide: {
    display: "none !important",
  },
}));

const getTicketFiltersKey = userId => `tickets:filters:${userId || "anon"}`;

const readSavedTicketFilters = userId => {
  try {
    const value = sessionStorage.getItem(getTicketFiltersKey(userId));
    return value ? JSON.parse(value) : {};
  } catch (err) {
    return {};
  }
};

const TicketsManager = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const savedFiltersRef = useRef(readSavedTicketFilters(user?.id));
  const savedFilters = savedFiltersRef.current;
  const isAdmin = user?.profile?.toUpperCase() === "ADMIN";
  const [searchParam, setSearchParam] = useState(savedFilters.searchParam || "");
  const [tab, setTab] = useState(savedFilters.tab || "open");
  const [tabOpen, setTabOpen] = useState(savedFilters.tabOpen || "open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(
    typeof savedFilters.showAllTickets === "boolean"
      ? savedFilters.showAllTickets
      : Boolean(isAdmin)
  );
  const searchInputRef = useRef();
  const searchTimeoutRef = useRef();
  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [availableQueues, setAvailableQueues] = useState(user?.queues || []);
  const [ecosystems, setEcosystems] = useState([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState(
    Array.isArray(savedFilters.selectedQueueIds)
      ? savedFilters.selectedQueueIds
      : []
  );
  const [selectedEcosystemId, setSelectedEcosystemId] = useState(
    savedFilters.selectedEcosystemId || ""
  );

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
    try {
      sessionStorage.setItem(
        getTicketFiltersKey(user?.id),
        JSON.stringify({
          searchParam,
          tab,
          tabOpen,
          showAllTickets,
          selectedQueueIds,
          selectedEcosystemId,
        })
      );
    } catch (err) {
      // La persistencia de filtros no debe bloquear la bandeja.
    }
  }, [
    searchParam,
    selectedEcosystemId,
    selectedQueueIds,
    showAllTickets,
    tab,
    tabOpen,
    user?.id,
  ]);

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
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setNewTicketModalOpen(true)}
            >
              {i18n.t("ticketsManager.buttons.newTicket")}
            </Button>
            <Can
              role={user.profile}
              perform="tickets-manager:showall"
              yes={() => (
                <FormControlLabel
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
          </>
        )}
        <div className={classes.filtersBox}>
          <TicketsQueueSelect
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
              <Badge
                className={classes.badge}
                badgeContent={openCount}
                color="primary"
              >
                {i18n.t("ticketsList.assignedHeader")}
              </Badge>
            }
            value={"open"}
          />
          <Tab
            label={
              <Badge
                className={classes.badge}
                badgeContent={pendingCount}
                color="secondary"
              >
                {i18n.t("ticketsList.pendingHeader")}
              </Badge>
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
