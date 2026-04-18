import "dotenv/config";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import {
  aggregateIdeaTeamScores,
  recomputeNormalizedScores,
} from "../src/db/services/evaluation-services";
import {
  aggregateTeamScores,
  recalculateNormalizedScores,
} from "../src/db/services/judge-services";
import {
  AGGREGATE_SCORES_JOB_NAME,
  EVALUATION_AGGREGATE_SCORES_JOB_NAME,
  EVALUATION_NORMALIZE_JOB_NAME,
  JUDGE_NORMALIZE_JOB_NAME,
  QUEUE_NAME,
} from "../src/lib/queue/normalization";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required");
  process.exit(1);
}

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

let worker: Worker | null = null;

export async function addAggregationJob(judgeRoundId: string) {
  const jobId = `aggregate-${judgeRoundId}`;
  await new Queue(QUEUE_NAME, { connection }).add(
    AGGREGATE_SCORES_JOB_NAME,
    { judgeRoundId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      delay: 2000, // 2 second delay to allow normalization to complete
    },
  );
}

async function startWorker() {
  try {
    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        console.log(`[normalization] Received job of type ${job.name}`);

        if (job.name === JUDGE_NORMALIZE_JOB_NAME) {
          const { judgeId, judgeRoundId } = job.data as {
            judgeId: string;
            judgeRoundId: string;
          };
          console.log(
            `[normalization] Processing judge scores: judge=${judgeId} round=${judgeRoundId}`,
          );
          await recalculateNormalizedScores(judgeId, judgeRoundId);
          console.log(
            `[normalization] Done judge scores: judge=${judgeId} round=${judgeRoundId}`,
          );
          return;
        }

        if (job.name === AGGREGATE_SCORES_JOB_NAME) {
          const { judgeRoundId } = job.data as { judgeRoundId: string };
          console.log(
            `[normalization] Aggregating judge team scores: round=${judgeRoundId}`,
          );
          await aggregateTeamScores(judgeRoundId);
          console.log(
            `[normalization] Done aggregating team scores: round=${judgeRoundId}`,
          );
          return;
        }

        if (job.name === EVALUATION_NORMALIZE_JOB_NAME) {
          const { evaluatorId, roundId } = job.data as {
            evaluatorId: string;
            roundId: string;
          };
          console.log(
            `[normalization] Processing evaluation scores: evaluator=${evaluatorId} round=${roundId}`,
          );
          await recomputeNormalizedScores(evaluatorId, roundId);
          console.log(
            `[normalization] Done evaluation scores: evaluator=${evaluatorId} round=${roundId}`,
          );
          return;
        }

        if (job.name === EVALUATION_AGGREGATE_SCORES_JOB_NAME) {
          const { roundId } = job.data as { roundId: string };
          console.log(
            `[normalization] Aggregating evaluation team scores: round=${roundId}`,
          );
          await aggregateIdeaTeamScores(roundId);
          console.log(
            `[normalization] Done aggregating evaluation scores: round=${roundId}`,
          );
          return;
        }

        throw new Error(`Unknown normalization job: ${job.name}`);
      },
      {
        connection,
        concurrency: 1,
      },
    );

    worker.on("failed", (job, err) => {
      console.error(
        `[normalization] Job ${job?.id} (${job?.name}) failed: ${err.message}`,
      );
    });

    worker.on("error", (err) => {
      console.error(
        `[normalization] Worker error, restarting in 3s:`,
        err.message,
      );
      setTimeout(startWorker, 3000);
    });

    worker.on("ready", () => {
      console.log("[normalization] Worker ready and listening for jobs...");
    });
  } catch (err) {
    console.error(
      "[normalization] Failed to start worker, retrying in 3s:",
      err,
    );
    setTimeout(startWorker, 3000);
  }
}

process.on("SIGINT", async () => {
  console.log("[normalization] Shutting down...");
  await worker?.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[normalization] SIGTERM received, shutting down...");
  await worker?.close();
  process.exit(0);
});

startWorker();
