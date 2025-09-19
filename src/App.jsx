import React from "react";
import Header from "./components/Header";
import JobList from "./components/JobList";

function App() {

  const [jobs, setJobs] = React.useState(() => {
       const saved = localStorage.getItem("jobs");
       return saved ? JSON.parse(saved) : [];
  });
  const [selectJobId, setSelectedJobId] = React.useState(null);
  React.useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs));   
  }, )


}