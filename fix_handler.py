import re

path = "backend/internal/interfaces/rest/handlers/auth_handler.go"
with open(path, 'r') as f:
    content = f.read()

# Login & Refresh & Register have output.User, Me has user
content = re.sub(r'"emailVerified":\s+output.User.EmailVerified,', '"emailVerified": output.User.EmailVerified,\n\t\t\t"tenantId":      output.User.TenantID,', content)
content = re.sub(r'"emailVerified":\s+user.EmailVerified,', '"emailVerified": user.EmailVerified,\n\t\t"tenantId":      user.TenantID,', content)

with open(path, 'w') as f:
    f.write(content)
