// Helper: Extract role type from job title
function extractRoleType(title) {
  const title_lower = title.toLowerCase();
  
  if (title_lower.includes("frontend")) return "Frontend";
  if (title_lower.includes("backend")) return "Backend";
  if (title_lower.includes("fullstack") || title_lower.includes("full stack")) return "Fullstack";
  if (title_lower.includes("devops")) return "DevOps";
  if (title_lower.includes("qa")) return "QA";
  
  return "Other";
}

// Helper: Calculate response rate for a specific role type
function getResponseRate(jobs, roleType) {
  const jobsOfType = jobs.filter(j => extractRoleType(j.title) === roleType);
  if (jobsOfType.length === 0) return 0;
  
  const responded = jobsOfType.filter(j => 
    j.status === "Interviewing" || j.status === "Offer" || j.status === "Rejected"
  ).length;
  
  return Math.round((responded / jobsOfType.length) * 100);
}

// Helper: Calculate how many interviews convert to offers
function getInterviewConversionRate(jobs) {
  const interviewed = jobs.filter(j => j.status === "Interviewing").length;
  const offered = jobs.filter(j => j.status === "Offer").length;
  
  if (interviewed === 0) return 0;
  return Math.round((offered / interviewed) * 100);
}

// Helper: Find the best month (most responses)
function getBestMonth(jobs) {
  if (jobs.length === 0) return null;
  
  const byMonth = {};
  for (const job of jobs) {
    const date = new Date(job.date);
    const month = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    
    if (!byMonth[month]) {
      byMonth[month] = { count: 0, responses: 0 };
    }
    
    byMonth[month].count++;
    
    if (job.status === "Interviewing" || job.status === "Offer" || job.status === "Rejected") {
      byMonth[month].responses++;
    }
  }
  
  let bestMonth = null;
  let bestRate = 0;
  
  for (const month in byMonth) {
    const rate = (byMonth[month].responses / byMonth[month].count);
    if (rate > bestRate) {
      bestRate = rate;
      bestMonth = { 
        month, 
        count: byMonth[month].count, 
        responseRate: Math.round(rate * 100) 
      };
    }
  }
  
  return bestMonth;
}

// Main stats function
function getJobStats(jobs = []) {
  const totals = {
    total: jobs.length,
    Applied: 0,
    Interviewing: 0,
    Offer: 0,
    Rejected: 0,
  };

  for (const j of jobs) {
    if (totals[j.status] != null) totals[j.status]++;
  }

  const successRate =
    totals.total > 0 ? Math.round((totals.Offer / totals.total) * 100) : 0;

  // NEW: Response rates by role type
  const roleTypes = [...new Set(jobs.map(j => extractRoleType(j.title)))];
  const responseByRole = {};
  
  for (const role of roleTypes) {
    responseByRole[role] = getResponseRate(jobs, role);
  }

  // NEW: Interview to offer conversion
  const interviewConversionRate = getInterviewConversionRate(jobs);

  // NEW: Best month
  const bestMonth = getBestMonth(jobs);

  return {
    totals,
    successRate,
    responseByRole,
    interviewConversionRate,
    bestMonth
  };
}

export default getJobStats;