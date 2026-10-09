package bootstrap

import (
	"context"
	"testing"
	"time"
)

func TestStartReportCleanupWorker_ContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	// Start worker with nil service and cancel immediately
	StartReportCleanupWorker(ctx, nil)
	cancel()

	// Give a moment to ensure no goroutine hangs or panics
	time.Sleep(50 * time.Millisecond)
}

func TestRunReportCleanup_NilService(t *testing.T) {
	// Should return cleanly without panicking
	runReportCleanup(context.Background(), nil)
}

func TestApp_Close_GracefulShutdownWithWorker(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	app := &App{
		cleanupCancel: cancel,
	}

	// Start worker registered with app.workerWg
	StartReportCleanupWorker(ctx, nil, &app.workerWg)

	// Close should cancel worker and wait cleanly
	closeCtx, closeCancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer closeCancel()

	if err := app.Close(closeCtx); err != nil {
		t.Fatalf("unexpected error on App.Close: %v", err)
	}
}
