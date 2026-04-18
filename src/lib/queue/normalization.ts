import { Queue } from "bullmq";
import { getRedisClient } from "~/lib/redis";

const QUEUE_NAME = "score-normalization";
const JUDGE_NORMALIZE_JOB_NAME = "normalize-scores";
const EVALUATION_NORMALIZE_JOB_NAME = "normalize-evaluation-scores";
const AGGREGATE_SCORES_JOB_NAME = "aggregate-team-scores";
const EVALUATION_AGGREGATE_SCORES_JOB_NAME = "aggregate-evaluation-scores";

let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: getRedisClient() });
  }
  return queue;
}

export async function addNormalizationJob(
  judgeId: string,
  judgeRoundId: string,
) {
  const jobId = `normalize-${judgeId}-${judgeRoundId}`;

  await getQueue().add(
    JUDGE_NORMALIZE_JOB_NAME,
    { judgeId, judgeRoundId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  );
}

export async function addAggregationJob(judgeRoundId: string) {
  const jobId = `aggregate-${judgeRoundId}`;

  await getQueue().add(
    AGGREGATE_SCORES_JOB_NAME,
    { judgeRoundId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
     delay: 10000, // 10 second delay to allow normalization to complete
    },
  );
}

export async function addEvaluationNormalizationJob(
  evaluatorId: string,
  roundId: string,
) {
  const jobId = `normalize-evaluation-${roundId}-${evaluatorId}`;

  await getQueue().add(
    EVALUATION_NORMALIZE_JOB_NAME,
    { roundId, evaluatorId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  );
}

export async function addEvaluationAggregationJob(roundId: string) {
  const jobId = `aggregate-evaluation-${roundId}`;

  await getQueue().add(
    EVALUATION_AGGREGATE_SCORES_JOB_NAME,
    { roundId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      delay: 5000,
    },
  );
}

export {
  EVALUATION_NORMALIZE_JOB_NAME,
  JUDGE_NORMALIZE_JOB_NAME,
  EVALUATION_AGGREGATE_SCORES_JOB_NAME,
  AGGREGATE_SCORES_JOB_NAME,
  QUEUE_NAME,
};
