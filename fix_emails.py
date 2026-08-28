import re

def replace_in_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Remove the car emoji
    content = re.sub(r'🚗\s*Photo Storage', '📸 Photo Storage', content)
    # Remove mentions of vehicles
    content = re.sub(r'liberar o cadastro dos seus veículos na plataforma', 'liberar o cadastro das suas fotos e eventos na plataforma', content)
    
    # Just to be sure, any generic vehicle words
    content = re.sub(r'veículos', 'eventos', content)
    content = re.sub(r'veículo', 'evento', content)

    with open(path, 'w') as f:
        f.write(content)

replace_in_file('backend/internal/infrastructure/email/templates/verification.html')
replace_in_file('backend/internal/infrastructure/email/templates/password_reset.html')

path_sender = "backend/internal/infrastructure/email/sender.go"
with open(path_sender, 'r') as f:
    content = f.read()
content = re.sub(r'liberar o cadastro de veículos', 'liberar o cadastro das suas fotos e eventos', content)
with open(path_sender, 'w') as f:
    f.write(content)

path_main = "backend/cmd/api/main.go"
with open(path_main, 'r') as f:
    content = f.read()
content = re.sub(r'API REST para gestão inteligente de veículos, revisões e manutenções', 'API REST para gestão inteligente de fotografias e eventos caninos', content)
with open(path_main, 'w') as f:
    f.write(content)

