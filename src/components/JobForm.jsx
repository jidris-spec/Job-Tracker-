import * as React from "react";
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
} from "@mui/material";

const STATUSES = ["Applied", "Interviewing", "Offer", "Rejected"];

// Single validator/normalizer
const validateAndNormalizeUrl = (value) => {
  if (!value) return { error: "", url: "" };
  try {
    new URL(value);
    return { error: "", url: value };
  } catch {
    try {
      const fixed = `https://${value}`;
      new URL(fixed);
      return { error: "", url: fixed };
    } catch {
      return {
        error: "Enter a valid URL (e.g. https://company.com/job)",
        url: "",
      };
    }
  }
};

function JobForm({ onCreate, open: externalOpen, setOpen: setExternalOpen, hideTrigger = false }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = setExternalOpen ?? setInternalOpen;

  const [form, setForm] = React.useState({
    company: "",
    title: "",
    status: "Applied",
    date: new Date().toISOString().slice(0, 10),
    link: "",
    notes: "",
  });
  const [linkError, setLinkError] = React.useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "link" && linkError) setLinkError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { error, url } = validateAndNormalizeUrl(form.link);
    setLinkError(error);
    if (error) return;

    const job = { id: Date.now(), ...form, link: url };
    onCreate?.(job);
    setOpen(false);

    // reset form
    setForm({
      company: "",
      title: "",
      status: "Applied",
      date: new Date().toISOString().slice(0, 10),
      link: "",
      notes: "",
    });
    setLinkError("");
  };

  return (
    <>
      {!hideTrigger && (
        <Button variant="contained" onClick={() => setOpen(true)}>
          + Add Job
        </Button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Job</DialogTitle>

        <form id="job-form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
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
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
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
                InputLabelProps={{ shrink: true }}
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
                  const { error } = validateAndNormalizeUrl(e.target.value);
                  setLinkError(error);
                }}
                error={Boolean(linkError)}
                helperText={linkError || "Optional but recommended"}
                inputProps={{ inputMode: "url" }}
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
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="job-form" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default JobForm;
