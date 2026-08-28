import os
import re

def replace_in_file(path, pattern, replacement):
    with open(path, 'r') as f:
        content = f.read()
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    with open(path, 'w') as f:
        f.write(content)

# Backend User domain
replace_in_file("backend/internal/domain/user/user.go", r"\s*MaxVehicles\s+int\s+`json:\"maxVehicles\"`\n", "\n")

# Backend Auth Usecase
replace_in_file("backend/internal/application/usecase/auth/service.go", r"\s*MaxVehicles:\s*3,\n", "\n")

# Backend Auth Handler
replace_in_file("backend/internal/interfaces/rest/handlers/auth_handler.go", r"\s*\"maxVehicles\":.*?\n", "\n")

# Frontend Auth Types
replace_in_file("frontend/src/features/auth/types/auth.types.ts", r"\s*maxVehicles\?: number;\n", "\n")

# Frontend Profile Types
replace_in_file("frontend/src/features/profile/types/profile.types.ts", r"\s*vehiclesCount: number;\n", "\n")
replace_in_file("frontend/src/features/profile/types/profile.types.ts", r"\s*maxVehicles: number;\n", "\n")

# Frontend index.html and manifest
def fix_html(path):
    with open(path, 'r') as f:
        content = f.read()
    content = re.sub(r'Controle manutenções preventivas, histórico de revisões, custos e alertas automáticos do seu veículo em uma plataforma moderna, rápida e segura.', 'Plataforma completa para fotógrafos gerenciarem ensaios e fotos de competições caninas.', content)
    content = re.sub(r'gestão de veículos, controle de manutenção automotiva, revisões de carro, histórico veicular, custos do carro, PS', 'fotografia de cachorros, eventos caninos, storage de fotos, fotógrafo', content)
    content = re.sub(r'Controle manutenções preventivas, histórico de revisões, custos e alertas automáticos do seu veículo.', 'Plataforma para gestão de fotos de eventos caninos.', content)
    content = re.sub(r'Sistema de gestão inteligente de veículos, controle de revisões preventivas e custos automotivos.', 'Sistema de armazenamento e gestão de fotos de competições caninas.', content)
    content = re.sub(r'Sistema inteligente de gestão de veículos, manutenções preventivas e histórico automotivo.', 'Sistema inteligente para gestão de fotografias caninas.', content)
    with open(path, 'w') as f:
        f.write(content)

fix_html("frontend/index.html")
fix_html("frontend/public/site.webmanifest")

