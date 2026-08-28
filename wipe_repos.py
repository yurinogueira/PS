import re

def remove_max_vehicles_mongo():
    path = "backend/internal/infrastructure/user/mongo/repository.go"
    with open(path, 'r') as f:
        content = f.read()
    
    # Remove from model struct
    content = re.sub(r"\s*MaxVehicles\s+int\s+`bson:\"maxVehicles\"`", "", content)
    
    # Remove from FromDomain logic
    content = re.sub(r"\s*maxVehicles := d\.MaxVehicles\n\s*if maxVehicles <= 0 \{\n\s*maxVehicles = 3\n\s*\}", "", content)
    content = re.sub(r"\s*MaxVehicles:\s*maxVehicles,", "", content)
    
    # Remove from Update logic
    content = re.sub(r"\s*if user\.MaxVehicles <= 0 \{\n\s*user\.MaxVehicles = 3\n\s*\}", "", content)
    content = re.sub(r"\s*MaxVehicles:\s*user\.MaxVehicles,", "", content)
    content = re.sub(r"\s*\"maxVehicles\":\s*user\.MaxVehicles,", "", content)

    with open(path, 'w') as f:
        f.write(content)

def remove_max_vehicles_memory():
    path = "backend/internal/infrastructure/user/memory/repository.go"
    with open(path, 'r') as f:
        content = f.read()

    # Remove instances of if user.MaxVehicles <= 0 { user.MaxVehicles = 3 }
    content = re.sub(r"\s*if u(?:ser)?\.MaxVehicles <= 0 \{\n\s*u(?:ser)?\.MaxVehicles = 3\n\s*\}", "", content)
    with open(path, 'w') as f:
        f.write(content)

remove_max_vehicles_mongo()
remove_max_vehicles_memory()
