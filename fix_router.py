import re

path = "backend/internal/interfaces/rest/router.go"
with open(path, 'r') as f:
    content = f.read()

new_routes = """	mux.Handle("POST /api/v1/auth/register", authChain(authHandler.Register))
	mux.Handle("POST /api/v1/auth/login", authChain(authHandler.Login))
	mux.Handle("POST /api/v1/auth/forgot-password", authChain(authHandler.ForgotPassword))
	mux.Handle("POST /api/v1/auth/reset-password", authChain(authHandler.ResetPassword))
	mux.Handle("POST /api/v1/auth/verify-email", authChain(authHandler.VerifyEmail))
	mux.Handle("POST /api/v1/auth/resend-verification", authChain(authHandler.ResendVerification))"""

content = re.sub(r'	mux\.Handle\("POST /api/v1/auth/register", authChain\(authHandler\.Register\)\)\n	mux\.Handle\("POST /api/v1/auth/login", authChain\(authHandler\.Login\)\)', new_routes, content)

with open(path, 'w') as f:
    f.write(content)
