import re

path = ".github/workflows/backend.yml"
with open(path, 'r') as f:
    content = f.read()

content = re.sub(
    r'\s+VAL="\$\{!VAR:-\}"', 
    '\n            # Injetar variáveis no ambiente\n            for VAR in SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS EMAIL_FROM APP_BASE_URL; do\n              VAL="${!VAR:-}"',
    content
)

with open(path, 'w') as f:
    f.write(content)
