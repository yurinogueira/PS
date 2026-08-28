import re

path = ".agents/skills/ps-workflow/SKILL.md"
with open(path, 'r') as f:
    content = f.read()

content = re.sub(r'\n    - `feat/22-fipe-cache-integration`: Features vinculadas à issue #22\.', '', content)
content = re.sub(r'\n    - `feat\(cars\): integrar fipe api com cache multinivel no mongodb \(#22\)`', '', content)

with open(path, 'w') as f:
    f.write(content)
