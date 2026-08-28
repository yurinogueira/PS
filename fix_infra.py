import os

files_to_check = []
for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root or "dist" in root:
        continue
    for f in files:
        if f.endswith((".yml", ".yaml", ".md", ".env.example", ".service", "Caddyfile", ".sh", ".hcl", ".tf", ".json", "Dockerfile")):
            if "frontend" in root or "backend" in root or "terraform" in root or "deploy" in root or ".github" in root or f == "docker-compose.yml":
                files_to_check.append(os.path.join(root, f))

for filepath in files_to_check:
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content.replace("cvmc", "ps").replace("CVMC", "PS")
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
            
print("Done")
