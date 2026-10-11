import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { StorageService } from './services/storage.service.js';
import { EscalationService } from './services/escalation.service.js';
import { RepresentativeTermService } from './services/representative-term.service.js';
import { MonthlyReportService } from './services/monthly-report.service.js';

async function bootstrap() {
  await StorageService.init();
  await connectDB();
  EscalationService.startScheduler();
  RepresentativeTermService.startScheduler();
  MonthlyReportService.startScheduler();

  const server = app.listen(config.port, () => {
    console.log(`\n=================================================`);
    console.log(`  RAISE: Report • Amplify • Inform • Solve • Escalate `);
    console.log(`  Citizen Voice Platform API Server                `);
    console.log(`  Listening on: http://localhost:${config.port}            `);
    console.log(`  Environment:  ${config.nodeEnv}                     `);
    console.log(`  OTP Provider: ${config.otpProvider}                         `);
    console.log(`=================================================\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
    try {
      EscalationService.stopScheduler();
      RepresentativeTermService.stopScheduler();
      MonthlyReportService.stopScheduler();
      server.close(async () => {
        console.log('[SHUTDOWN] HTTP listener terminated.');
        try {
          await mongoose.connection.close();
          console.log('[SHUTDOWN] MongoDB connection successfully closed.');
          process.exit(0);
        } catch (dbErr) {
          console.error('[SHUTDOWN] Error closing MongoDB connection:', dbErr);
          process.exit(1);
        }
      });

      // Fail-safe force exit after 10 seconds
      setTimeout(() => {
        console.error('[SHUTDOWN] Force terminating process after timeout.');
        process.exit(1);
      }, 10000).unref();
    } catch (err) {
      console.error('[SHUTDOWN] Unhandled error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
