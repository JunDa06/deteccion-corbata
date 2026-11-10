
from ultralytics import YOLO

print("===== INICIANDO ENTRENAMIENTO =====")

# Cargar modelo preentrenado
modelo = YOLO("yolov8n.pt")

# Entrenar el detector de corbatas
resultados = modelo.train(
    data="dataset/data.yaml",
    epochs=50,
    imgsz=640,
    batch=8,
    device="cpu",
    workers=2,
    project="models",
    name="detector_corbata",
    patience=15,
    seed=42
)

print("\n===== ENTRENAMIENTO FINALIZADO =====")
print("Revisa los resultados dentro de models/detector_corbata/")
