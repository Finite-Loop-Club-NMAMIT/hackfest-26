import { Queue } from "bullmq";
import { getRedisClient } from "~/lib/redis";

const QUEUE_NAME = "score-normalization";

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
    "normalize-scores",
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

export { QUEUE_NAME };
