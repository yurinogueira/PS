import re

path = ".github/workflows/backend.yml"
with open(path, 'r') as f:
    content = f.read()

# Remove FIPE envs
content = re.sub(r'\s*FIPE_API_TOKEN:.*?$\n', '\n', content, flags=re.MULTILINE)
content = re.sub(r'\s*FIPE_BASE_URL:.*?$\n', '\n', content, flags=re.MULTILINE)

# Remove FIPE from the ssh line
content = re.sub(r'FIPE_API_TOKEN=\\"\$FIPE_API_TOKEN\\" FIPE_BASE_URL=\\"\$FIPE_BASE_URL\\" ', '', content)

# Remove FIPE from the loop
content = re.sub(r'FIPE_API_TOKEN FIPE_BASE_URL ', '', content)

with open(path, 'w') as f:
    f.write(content)
