let jobs = [];

exports.getJob = (jobId) => {
    return jobs.find(job => job.id === jobId);
};

exports.setJobStatus = (jobId, status) => {
    if (jobs.length > 0 ) {
        let foundJob = jobs.reduce(job => {
            return job.id === jobId;
        });

        if (foundJob) {
            foundJob.status = status;
        } else {
            jobs.push({id: jobId, status: status});
        }
    } else {
        jobs.push({id: jobId, status: status});
    }
};