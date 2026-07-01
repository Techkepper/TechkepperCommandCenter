import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import {
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
} from "@material-ui/core";
import { toast } from "react-toastify";

const splitTokens = (value) =>
  value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  field: ({ focused, hasContent }) => ({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    minHeight: 56,
    padding: focused ? "17px 13px 9px" : "18px 14px 10px",
    borderRadius: theme.shape.borderRadius,
    borderStyle: "solid",
    borderColor: focused
      ? theme.palette.primary.main
      : theme.palette.type === "dark"
        ? "rgba(255, 255, 255, 0.23)"
        : "rgba(0, 0, 0, 0.23)",
    borderWidth: focused ? 2 : 1,
    backgroundColor: theme.palette.background.paper,
    cursor: "text",
    transition: theme.transitions.create(["border-color", "border-width"]),
    "&:hover": {
      borderColor: focused
        ? theme.palette.primary.main
        : theme.palette.text.primary,
    },
    ...(hasContent && {
      paddingTop: focused ? 17 : 18,
      paddingBottom: focused ? 9 : 10,
    }),
  }),
  label: {
    backgroundColor: theme.palette.background.paper,
    paddingLeft: 4,
    paddingRight: 4,
  },
  chip: {
    maxWidth: "100%",
    height: 28,
    borderRadius: 16,
    fontWeight: 500,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(41, 182, 246, 0.22)"
        : "rgba(38, 126, 165, 0.14)",
    color: theme.palette.type === "dark" ? "#b3e5fc" : theme.palette.primary.dark,
    border: `1px solid ${
      theme.palette.type === "dark"
        ? "rgba(41, 182, 246, 0.45)"
        : "rgba(38, 126, 165, 0.35)"
    }`,
    "& .MuiChip-label": {
      paddingLeft: 10,
      paddingRight: 4,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .MuiChip-deleteIcon": {
      color:
        theme.palette.type === "dark"
          ? "rgba(179, 229, 252, 0.85)"
          : theme.palette.primary.dark,
      marginRight: 4,
      "&:hover": {
        color: theme.palette.error.main,
      },
    },
  },
  input: {
    flex: "1 1 140px",
    minWidth: 140,
    border: "none",
    outline: "none",
    background: "transparent",
    font: "inherit",
    fontSize: "1rem",
    color: theme.palette.text.primary,
    padding: "4px 0",
    margin: 0,
  },
}));

const TagListInput = ({
  label,
  helperText,
  items,
  onChange,
  validateItem,
  invalidMessage,
  placeholder,
}) => {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const hasContent = items.length > 0 || Boolean(draft);
  const classes = useStyles({ focused, hasContent: items.length > 0 || focused });

  const focusInput = () => inputRef.current?.focus();

  const addItems = (candidates) => {
    const next = [...items];
    let added = false;

    candidates.forEach((candidate) => {
      const value = candidate.trim();
      if (!value || next.includes(value)) return;
      if (validateItem && !validateItem(value)) {
        toast.error(invalidMessage || `Valor inválido: ${value}`);
        return;
      }
      next.push(value);
      added = true;
    });

    if (added) onChange(next);
    setDraft("");
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    addItems([draft]);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === ";") {
      event.preventDefault();
      commitDraft();
      return;
    }

    if (event.key === "Backspace" && !draft && items.length) {
      onChange(items.slice(0, -1));
    }
  };

  const handlePaste = (event) => {
    const text = event.clipboardData.getData("text");
    if (!/[;,\n]/.test(text)) return;
    event.preventDefault();
    addItems(splitTokens(text));
  };

  const labelShrink = focused || items.length > 0 || Boolean(draft);

  return (
    <FormControl className={classes.root} variant="outlined">
      <InputLabel
        className={classes.label}
        htmlFor={`tag-list-${label}`}
        shrink={labelShrink}
      >
        {label}
      </InputLabel>
      <div
        className={classes.field}
        onClick={focusInput}
        role="presentation"
      >
        {items.map((item) => (
          <Chip
            key={item}
            className={classes.chip}
            label={item}
            size="small"
            title={item}
            onDelete={(event) => {
              event.stopPropagation();
              onChange(items.filter((entry) => entry !== item));
            }}
          />
        ))}
        <input
          ref={inputRef}
          id={`tag-list-${label}`}
          className={classes.input}
          type="text"
          value={draft}
          placeholder={items.length ? "" : placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commitDraft();
          }}
          onPaste={handlePaste}
        />
      </div>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

TagListInput.propTypes = {
  label: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  validateItem: PropTypes.func,
  invalidMessage: PropTypes.string,
  placeholder: PropTypes.string,
};

export default TagListInput;
