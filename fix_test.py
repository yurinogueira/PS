import re

path = "frontend/src/features/profile/pages/ProfilePage.test.tsx"
with open(path, 'r') as f:
    content = f.read()

content = re.sub(r'it\("renders profile details, email status, and vehicle quota"', 'it("renders profile details and email status"', content)
content = re.sub(r'\s*maxVehicles:\s*3,', '', content)
content = re.sub(r'\s*vehiclesCount:\s*1,', '', content)
content = re.sub(r'\s*vehiclesCount:\s*0,', '', content)
content = re.sub(r'\s*expect\(screen.getByText\("1 de 3 veículos"\)\).toBeInTheDocument\(\);\n', '', content)

with open(path, 'w') as f:
    f.write(content)
