import os
import re

files_to_check = []
for root, dirs, files in os.walk("."):
    if any(d in root for d in [".git", "node_modules", "dist", ".terraform", "uploads"]):
        continue
    for f in files:
        if f.endswith((".ts", ".tsx", ".js", ".jsx", ".html", ".css", ".md", ".sh", ".go", ".json", "xml", "txt", "webmanifest", "CNAME")):
            files_to_check.append(os.path.join(root, f))

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    new_content = content.replace("cvmc", "ps").replace("CVMC", "PS")
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
print("Done")
