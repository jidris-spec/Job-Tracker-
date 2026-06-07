import React, {
  useState,
  useEffect,
} from "react";

import { validateAndNormalizeUrl } from "../utils/validation";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const STATUSES = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];

function JobForm({
  onCreate,
  onUpdate,

  open: externalOpen,
  setOpen: setExternalOpen,

  hideTrigger = false,

  jobToEdit,
  onClose,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Internal modal state
  const [internalOpen, setInternalOpen] =
    useState(false);

  // Use external state if provided
  const open =
    externalOpen ?? internalOpen;

  const setOpen =
    setExternalOpen ?? setInternalOpen;

  // Form statejobform
  const [form, setForm] = useState({
    company: "",
    title: "",
    status: "Applied",
    date: new Date()
      .toISOString()
      .slice(0, 10),
    link: "",
    notes: "",
  });

  const [linkError, setLinkError] =
    useState("");

  // Populate form when editing
  useEffect(() => {
    if (!open) return;

    if (jobToEdit) {
      const { id, ...rest } = jobToEdit;

      setForm({
        company: rest.company || "",
        title: rest.title || "",
        status:
          rest.status || "Applied",
        date:
          rest.date ||
          new Date()
            .toISOString()
            .slice(0, 10),
        link: rest.link || "",
        notes: rest.notes || "",
      });
    } else {
      setForm({
        company: "",
        title: "",
        status: "Applied",
        date: new Date()
          .toISOString()
          .slice(0, 10),
        link: "",
        notes: "",
      });
    }

    setLinkError("");
  }, [open, jobToEdit]);

  // Close dialog
  const closeDialog = () => {
    setOpen(false);

    onClose?.();
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      name === "link" &&
      linkError
    ) {
      setLinkError("");
    }
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    const { error, url } =
      validateAndNormalizeUrl(
        form.link
      );

    setLinkError(error);

    if (error) return;

    // EDIT MODE
    if (jobToEdit) {
      const partial = {
        company: form.company,
        title: form.title,
        status: form.status,
        date: form.date,
        link: url,
        notes: form.notes,
      };

      onUpdate?.(
        jobToEdit.id,
        partial
      );

      closeDialog();

      return;
    }

    // CREATE MODE
    const job = {
      id: crypto.randomUUID(),
      ...form,
      link: url,
    };

    onCreate?.(job);

    closeDialog();

    // Reset form
    setForm({
      company: "",
      title: "",
      status: "Applied",
      date: new Date()
        .toISOString()
        .slice(0, 10),
      link: "",
      notes: "",
    });

    setLinkError("");
  };

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="contained"
          onClick={() =>
            setOpen(true)
          }
        >
          + Add Job
        </Button>
      )}

      <Dialog
        open={open}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: isMobile ? 1 : 3 }}>
          {jobToEdit ? "Edit Job" : "Add New Job"}
          {isMobile && (
            <IconButton onClick={closeDialog} size="small" aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>

        <form
          id="job-form"
          onSubmit={handleSubmit}
        >
          <DialogContent>
            <Stack
              spacing={2}
              sx={{ mt: 1 }}
            >
              <TextField
                name="company"
                label="Company"
                value={form.company}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                name="title"
                label="Title"
                value={form.title}
                onChange={handleChange}
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel id="status-label">
                  Status
                </InputLabel>

                <Select
                  labelId="status-label"
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {STATUSES.map((s) => (
                    <MenuItem
                      key={s}
                      value={s}
                    >
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                name="date"
                label="Date"
                type="date"
                value={form.date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                required
              />

              <TextField
                name="link"
                label="Link"
                placeholder="https://company.com/careers/frontend-dev"
                value={form.link}
                onChange={handleChange}
                onBlur={(e) => {
                  const { error } =
                    validateAndNormalizeUrl(
                      e.target.value
                    );

                  setLinkError(error);
                }}
                error={Boolean(
                  linkError
                )}
                helperText={
                  linkError ||
                  "Mandatory"
                }
                inputProps={{
                  inputMode: "url",
                }}
                fullWidth
              />

              <TextField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                multiline
                minRows={4}
                fullWidth
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={closeDialog}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="job-form"
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default JobForm;