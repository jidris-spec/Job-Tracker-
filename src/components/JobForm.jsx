import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { supabase } from "../supabaseClient";

const emptyForm = {
  company: "",
  title: "",
  status: "Applied",
  date: new Date().toISOString().slice(0, 10),
  link: "",
  notes: "",
  cv: null,
  coverLetter: null,
};

export default function JobForm({
  open,
  onCreate,
  onUpdate,
  jobToEdit = null,
  onClose,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset the form whenever the dialog opens, or switches between add/edit
  useEffect(() => {
    if (open) {
      setFormData(jobToEdit ? { ...emptyForm, ...jobToEdit } : emptyForm);
      setError("");
    }
  }, [open, jobToEdit]);

  const handleFileSelect = (e, fileType) => {
    const file = e.target.files[0];

    if (!file) return;

    if (fileType === "cv") {
      setFormData({ ...formData, cv: file });
    } else if (fileType === "coverLetter") {
      setFormData({ ...formData, coverLetter: file });
    }
  };

  const uploadFileToSupabase = async (file, jobId, fileType) => {
    if (!file) return null;

    try {
      const fileName = `${jobId}_${fileType}_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("job-attachments")
        .upload(fileName, file);

      if (error) throw error;

      // Get the public URL
      const { data: publicData } = supabase.storage
        .from("job-attachments")
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (err) {
      console.error(`Error uploading ${fileType}:`, err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let cvUrl = jobToEdit?.cv_url || null;
      let coverLetterUrl = jobToEdit?.cover_letter_url || null;

      // Generate temporary ID for new jobs (will be replaced by Supabase)
      const tempId = jobToEdit?.id || `temp_${Date.now()}`;

      // Upload CV if selected
      if (formData.cv) {
        cvUrl = await uploadFileToSupabase(formData.cv, tempId, "cv");
      }

      // Upload Cover Letter if selected
      if (formData.coverLetter) {
        coverLetterUrl = await uploadFileToSupabase(
          formData.coverLetter,
          tempId,
          "coverLetter"
        );
      }

      // Prepare job data without file objects
      const jobData = {
        company: formData.company,
        title: formData.title,
        status: formData.status,
        date: formData.date,
        link: formData.link,
        notes: formData.notes,
        cv_url: cvUrl,
        cover_letter_url: coverLetterUrl,
      };

      if (jobToEdit) {
        await onUpdate(jobToEdit.id, jobData);
      } else {
        await onCreate(jobData);
      }

      setLoading(false);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit form");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{jobToEdit ? "Edit Job" : "Add Job"}</DialogTitle>
      <DialogContent>
        <Box component="form" id="job-form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Job Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            margin="normal"
          >
            <MenuItem value="Applied">Applied</MenuItem>
            <MenuItem value="Interviewing">Interviewing</MenuItem>
            <MenuItem value="Technical Test">Technical Test</MenuItem>
            <MenuItem value="Offer">Offer</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Job Link"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />

          {/* CV Upload */}
          <Box sx={{ marginTop: 2 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
              Upload CV (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e, "cv")}
              style={{ display: "block" }}
            />
            {formData.cv && (
              <p style={{ marginTop: 8, color: "green" }}>✅ CV selected: {formData.cv.name}</p>
            )}
          </Box>

          {/* Cover Letter Upload */}
          <Box sx={{ marginTop: 2 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
              Upload Cover Letter (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e, "coverLetter")}
              style={{ display: "block" }}
            />
            {formData.coverLetter && (
              <p style={{ marginTop: 8, color: "green" }}>
                ✅ Cover Letter selected: {formData.coverLetter.name}
              </p>
            )}
          </Box>

          {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="job-form" variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Save Job"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
