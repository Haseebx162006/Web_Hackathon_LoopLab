const logger = require('../../utils/logger');

const QUEUE_NAME = 'email-jobs';
const DEFAULT_CONCURRENCY = Number(process.env.EMAIL_QUEUE_CONCURRENCY) || 3;

let bullmq;
let Redis;

let processor;
let queueMode = 'memory';
let queue;
let worker;
let connection;

const inMemoryQueue = [];
let drainingMemoryQueue = false;
let inMemoryCounter = 0;

const shouldUseRedisQueue = () => Boolean(process.env.REDIS_URL);

const loadBullDependencies = () => {
  if (bullmq && Redis) {
    return true;
  }

  try {
    // Loaded lazily so in-memory mode works even if these deps are unavailable.
    bullmq = require('bullmq');
    Redis = require('ioredis');
    return true;
  } catch (error) {
    logger.warn('BullMQ dependencies are unavailable. Falling back to in-memory email queue.', {
      error: error.message,
    });
    return false;
  }
};

const setupBullQueue = () => {
  if (queue || !shouldUseRedisQueue()) {
    return;
  }

  if (!loadBullDependencies()) {
    return;
  }

  try {
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    queue = new bullmq.Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    });

    queueMode = 'bullmq';

    connection.on('error', (error) => {
      logger.error('Redis connection error for email queue', { error: error.message });
    });

    logger.info('Email queue initialized in BullMQ mode');
  } catch (error) {
    queue = null;
    queueMode = 'memory';
    logger.error('BullMQ initialization failed. Using in-memory queue instead.', {
      error: error.message,
    });
  }
};

const setupBullWorker = () => {
  if (!queue || worker || typeof processor !== 'function') {
    return;
  }

  worker = new bullmq.Worker(
    QUEUE_NAME,
    async (job) => processor(job.name, job.data),
    {
      connection,
      concurrency: DEFAULT_CONCURRENCY,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Email job completed', {
      jobId: String(job.id),
      jobName: job.name,
      queueMode,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Email job failed', {
      jobId: job ? String(job.id) : 'unknown',
      jobName: job ? job.name : 'unknown',
      queueMode,
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    logger.error('Email worker error', { error: error.message });
  });
};

const drainInMemoryQueue = async () => {
  if (drainingMemoryQueue || typeof processor !== 'function') {
    return;
  }

  drainingMemoryQueue = true;
  try {
    while (inMemoryQueue.length > 0) {
      const job = inMemoryQueue.shift();
      try {
        await processor(job.name, job.data);
        logger.info('Email in-memory job completed', {
          jobId: job.id,
          jobName: job.name,
        });
      } catch (error) {
        logger.error('Email in-memory job failed', {
          jobId: job.id,
          jobName: job.name,
          error: error.message,
        });
      }
    }
  } finally {
    drainingMemoryQueue = false;
  }
};

const scheduleInMemoryDrain = () => {
  setImmediate(() => {
    drainInMemoryQueue().catch((error) => {
      logger.error('Email in-memory queue drain crashed', { error: error.message });
    });
  });
};

const initializeEmailQueue = () => {
  if (shouldUseRedisQueue()) {
    setupBullQueue();
    setupBullWorker();
  } else {
    queueMode = 'memory';
  }

  if (queueMode === 'memory') {
    scheduleInMemoryDrain();
  }
};

const setEmailQueueProcessor = (handler) => {
  processor = handler;
  initializeEmailQueue();
};

const enqueueEmailJob = async (jobName, data) => {
  if (queueMode === 'bullmq' && queue) {
    try {
      const job = await queue.add(jobName, data);
      return {
        id: String(job.id),
        mode: queueMode,
      };
    } catch (error) {
      logger.error('Failed to enqueue email job in BullMQ. Falling back to memory queue.', {
        jobName,
        error: error.message,
      });
      queueMode = 'memory';
    }
  }

  inMemoryCounter += 1;
  const job = {
    id: `memory-${Date.now()}-${inMemoryCounter}`,
    name: jobName,
    data,
  };

  inMemoryQueue.push(job);
  scheduleInMemoryDrain();

  return {
    id: job.id,
    mode: 'memory',
  };
};

const getEmailQueueMode = () => queueMode;

module.exports = {
  enqueueEmailJob,
  getEmailQueueMode,
  setEmailQueueProcessor,
};
