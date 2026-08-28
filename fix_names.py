import os

files_to_check = []
for root, dirs, files in os.walk("."):
    if any(d in root for d in [".git", "node_modules", "dist", ".terraform", "uploads"]):
        continue
    for f in files:
        if f.endswith((".ts", ".tsx", ".js", ".jsx", ".html", ".css", ".md", ".sh", ".go", ".json", "xml", "txt", "webmanifest", "CNAME", "yaml")):
            files_to_check.append(os.path.join(root, f))

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    new_content = content.replace("Como Vai Meu Carro", "Photo Storage").replace("como vai meu carro", "photo storage")
    new_content = new_content.replace("Gestão Inteligente de Veículos e Manutenções", "Gestão de Fotos de Competições de Cães")
    new_content = new_content.replace("Gestão Inteligente de Veículos", "Gestão de Fotos")
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
print("Done")
