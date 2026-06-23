const JOBS_PREFIX = "user_jobs_";

export const MockJobsAPI = {
  // Get jobs for a specific user
  getJobs(userId) {
    const key = `${JOBS_PREFIX}${userId}`;
    const jobs = localStorage.getItem(key);
    return jobs ? JSON.parse(jobs) : [];
  },

  // Save jobs for a specific user
  saveJobs(userId, jobs) {
    const key = `${JOBS_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(jobs));
  },

  // Create a job for a user
  createJob(userId, job) {
    const jobs = this.getJobs(userId);
    const newJob = {
      ...job,
      id: job.id || crypto.randomUUID(),
    };
    jobs.unshift(newJob);
    this.saveJobs(userId, jobs);
    return newJob;
  },

  // Update a job for a user
  updateJob(userId, jobId, partial) {
    const jobs = this.getJobs(userId);
    const updated = jobs.map((j) =>
      j.id === jobId ? { ...j, ...partial } : j
    );
    this.saveJobs(userId, updated);
    return updated.find((j) => j.id === jobId);
  },

  // Delete a job for a user
  deleteJob(userId, jobId) {
    const jobs = this.getJobs(userId).filter((j) => j.id !== jobId);
    this.saveJobs(userId, jobs);
    return true;
  },
};