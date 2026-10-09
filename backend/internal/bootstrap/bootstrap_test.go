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
