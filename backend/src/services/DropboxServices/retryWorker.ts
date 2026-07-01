import { logger } from "../../utils/logger";
import { retryPendingDropboxDocuments } from ".";

let running = false;

const retryIntervalMinutes = (): number => {
  const configured = Number(
    process.env.DROPBOX_SYNC_RETRY_INTERVAL_MINUTES || "5"
  );
  return Number.isFinite(configured) && configured >= 1 ? configured : 5;
};

export const startDropboxSyncRetryWorker = (): void => {
  if (
    String(process.env.DROPBOX_STORAGE_ENABLED || "false").toLowerCase() !==
    "true"
  ) {
    return;
  }
  const intervalMinutes = retryIntervalMinutes();
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const processed = await retryPendingDropboxDocuments();
      if (processed > 0) {
        logger.info(
          { provider: "dropbox", processed },
          "Dropbox document retry cycle completed"
        );
      }
    } catch (error) {
      logger.warn(
        { provider: "dropbox", errorName: (error as Error).name },
        "Dropbox document retry cycle failed"
      );
    } finally {
      running = false;
    }
  }, intervalMinutes * 60 * 1000);
  timer.unref();
  logger.info(
    { provider: "dropbox", intervalMinutes },
    "Dropbox document retry worker started"
  );
};
