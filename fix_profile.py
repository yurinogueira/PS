import re

path = "frontend/src/features/profile/pages/ProfilePage.tsx"
with open(path, 'r') as f:
    content = f.read()

content = re.sub(r'\s*const quotaPercent = Math\.min\(\n\s*Math\.round\(\(vehiclesCount / maxVehicles\) \* 100\),\n\s*100,\n\s*\);\n', '\n', content)

with open(path, 'w') as f:
    f.write(content)
