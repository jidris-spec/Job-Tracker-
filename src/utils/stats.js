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
  
    return { totals, successRate };

}

export default getJobStats;
  