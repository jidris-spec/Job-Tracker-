function exportJobsToCsv(jobs) {
    if (!jobs.length) {
      alert("No jobs to export");
      return;
    }
  
    //  fields i want to export
    const headers = ["Company", "Title", "Status", "Date", "Link", "Notes"];
    const rows = jobs.map(j => [
      j.company,
      j.title,
      j.status,
      j.date,
      j.link,
      j.notes?.replace(/\n/g, " ") // clean newlines
    ]);
  
    const csv = [
      headers.join(","),           // first row
      ...rows.map(r => r.map(v => `"${v || ""}"`).join(",")) // escape values
    ].join("\n");
  
    // create a downloadable blob
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
  
    // trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "job-applications.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

export default exportJobsToCsv;     