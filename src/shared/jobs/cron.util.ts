export function scheduleDailyAtMidnight(taskName: string, task: () => void | Promise<void>): void {
  function scheduleNextMidnightRun() {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0, 0
    );

    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        await task();
      } catch (err) {
        console.error(`[Cron - ${taskName}] Task error:`, err);
      }
      scheduleNextMidnightRun();
    }, timeUntilMidnight);
  }

  scheduleNextMidnightRun();
  console.log(`[Cron - ${taskName}] Programmé pour s'exécuter tous les jours à minuit.`);
}
