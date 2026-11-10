
from ultralytics import YOLO

print("===== EVALUANDO DETECTOR DE CORBATAS =====")

modelo = YOLO(
    "runs/detect/models/detector_corbata-3/weights/best.pt"
)

resultados = modelo.val(
    data="dataset/data.yaml",
    split="test",
    imgsz=640,
    batch=4,
    device="cpu"
)

print("\n===== EVALUACION FINALIZADA =====")
print("Precision:", resultados.box.mp)
print("Recall:", resultados.box.mr)
print("mAP50:", resultados.box.map50)
print("mAP50-95:", resultados.box.map)
