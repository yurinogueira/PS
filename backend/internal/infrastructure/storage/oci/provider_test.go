package oci

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"ps/internal/application/ports/storage"
)

func TestProvider_ObjectURL(t *testing.T) {
	tests := []struct {
		name     string
		cfg      Config
		path     string
		expected string
	}{
		{
			name: "Standard OCI endpoint",
			cfg: Config{
				Namespace: "test-ns",
				Bucket:    "test-bucket",
				Region:    "sa-saopaulo-1",
				Endpoint:  "https://objectstorage.sa-saopaulo-1.oraclecloud.com",
			},
			path:     "reports/tenant1/export.csv",
			expected: "https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/test-ns/b/test-bucket/o/reports%2Ftenant1%2Fexport.csv",
		},
		{
			name: "PAR OCI endpoint with trailing slash",
			cfg: Config{
				Namespace: "test-ns",
				Bucket:    "test-bucket",
				Region:    "sa-saopaulo-1",
				Endpoint:  "https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/secret-token/n/test-ns/b/test-bucket/o/",
			},
			path:     "reports/tenant1/export.csv",
			expected: "https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/secret-token/n/test-ns/b/test-bucket/o/reports%2Ftenant1%2Fexport.csv",
		},
		{
			name: "PAR OCI endpoint without trailing slash",
			cfg: Config{
				Namespace: "test-ns",
				Bucket:    "test-bucket",
				Region:    "sa-saopaulo-1",
				Endpoint:  "https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/secret-token/n/test-ns/b/test-bucket/o",
			},
			path:     "/reports/tenant1/export.csv",
			expected: "https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/secret-token/n/test-ns/b/test-bucket/o/reports%2Ftenant1%2Fexport.csv",
		},
		{
			name: "Default endpoint constructed from region",
			cfg: Config{
				Namespace: "test-ns",
				Bucket:    "test-bucket",
				Region:    "us-ashburn-1",
			},
			path:     "file.txt",
			expected: "https://objectstorage.us-ashburn-1.oraclecloud.com/n/test-ns/b/test-bucket/o/file.txt",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := New(tt.cfg)
			url := p.objectURL(tt.path)
			if url != tt.expected {
				t.Errorf("got %q, want %q", url, tt.expected)
			}
		})
	}
}

func TestProvider_Operations_WithPAR(t *testing.T) {
	fileData := []byte("id,name\n1,Alpha\n")
	var capturedMethod, capturedPath, capturedContentType string
	var capturedBody []byte

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMethod = r.Method
		capturedPath = r.URL.Path
		capturedContentType = r.Header.Get("Content-Type")
		capturedBody, _ = io.ReadAll(r.Body)

		switch r.Method {
		case http.MethodPut:
			w.WriteHeader(http.StatusOK)
		case http.MethodGet:
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(fileData)
		case http.MethodDelete:
			w.WriteHeader(http.StatusNoContent)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}))
	defer server.Close()

	parEndpoint := server.URL + "/p/par-token/n/ns/b/bucket/o"
	p := New(Config{
		Endpoint: parEndpoint,
		Client:   server.Client(),
	})

	ctx := context.Background()

	// 1. Save
	obj, err := p.Save(ctx, "reports/export.csv", storage.File{
		Data:        fileData,
		ContentType: "text/csv",
	})
	if err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	if obj.FileName != "reports/export.csv" || obj.Size != int64(len(fileData)) {
		t.Errorf("unexpected stored object: %+v", obj)
	}
	if capturedMethod != http.MethodPut || capturedPath != "/p/par-token/n/ns/b/bucket/o/reports/export.csv" {
		t.Errorf("unexpected request: %s %s", capturedMethod, capturedPath)
	}
	if capturedContentType != "text/csv" || string(capturedBody) != string(fileData) {
		t.Errorf("unexpected payload or content-type: %s %q", capturedContentType, capturedBody)
	}

	// 2. Get
	data, err := p.Get(ctx, "reports/export.csv")
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if string(data) != string(fileData) {
		t.Errorf("got %q, want %q", data, fileData)
	}
	if capturedMethod != http.MethodGet || capturedPath != "/p/par-token/n/ns/b/bucket/o/reports/export.csv" {
		t.Errorf("unexpected request: %s %s", capturedMethod, capturedPath)
	}

	// 3. Delete
	if err := p.Delete(ctx, "reports/export.csv"); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	if capturedMethod != http.MethodDelete || capturedPath != "/p/par-token/n/ns/b/bucket/o/reports/export.csv" {
		t.Errorf("unexpected request: %s %s", capturedMethod, capturedPath)
	}
}

func TestProvider_PathTraversal(t *testing.T) {
	p := New(Config{
		Namespace: "test-ns",
		Bucket:    "test-bucket",
		Region:    "sa-saopaulo-1",
	})
	ctx := context.Background()

	traversalPaths := []string{
		"../secret.txt",
		"/reports/../../etc/passwd",
		"folder/../../../escape",
	}

	for _, path := range traversalPaths {
		_, err := p.Save(ctx, path, storage.File{Data: []byte("test")})
		if err == nil || err.Error() != "invalid path: traversal detected" {
			t.Errorf("expected traversal error for Save(%q), got: %v", path, err)
		}

		_, err = p.Get(ctx, path)
		if err == nil || err.Error() != "invalid path: traversal detected" {
			t.Errorf("expected traversal error for Get(%q), got: %v", path, err)
		}

		err = p.Delete(ctx, path)
		if err == nil || err.Error() != "invalid path: traversal detected" {
			t.Errorf("expected traversal error for Delete(%q), got: %v", path, err)
		}
	}
}

func TestProvider_MissingConfigWithoutPAR(t *testing.T) {
	p := New(Config{
		Region: "sa-saopaulo-1",
	})
	ctx := context.Background()

	_, err := p.Save(ctx, "file.txt", storage.File{Data: []byte("test")})
	if err == nil {
		t.Error("expected error when namespace and bucket are empty without PAR")
	}

	_, err = p.Get(ctx, "file.txt")
	if err == nil {
		t.Error("expected error when namespace and bucket are empty without PAR")
	}

	err = p.Delete(ctx, "file.txt")
	if err == nil {
		t.Error("expected error when namespace and bucket are empty without PAR")
	}
}
