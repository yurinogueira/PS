import re

path = "frontend/src/routes/index.tsx"
with open(path, 'r') as f:
    content = f.read()

imports = """const RegisterPage = lazy(() =>
  import("../features/auth/pages/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("../features/auth/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);"""

content = re.sub(r'const RegisterPage = lazy\(\(\) =>\n  import\("\.\./features/auth/pages/RegisterPage"\)\.then\(\(m\) => \(\{\n    default: m\.RegisterPage,\n  \}\)\),\n\);', imports, content)

routes = """        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />"""

content = re.sub(r'        <Route path="/login" element={<LoginPage />} />\n        <Route path="/register" element={<RegisterPage />} />', routes, content)

with open(path, 'w') as f:
    f.write(content)
