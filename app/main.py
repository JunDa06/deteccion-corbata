from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from ultralytics import YOLO
from pathlib import Path
from threading import Lock
from time import perf_counter
import cv2
import numpy as np
import sys
import base64

# =====================================
# CONFIGURACION DE RUTAS
# =====================================

APP_DIR = Path(__file__).resolve().parent
BASE_DIR = APP_DIR.parent

RUTA_MODELO = (
    BASE_DIR
    / "runs"
    / "detect"
    / "models"
    / "detector_corbata-3"
    / "weights"
    / "best.pt"
)

# =====================================
# IMPORTAR ANONIMIZADOR
# =====================================

sys.path.append(str(BASE_DIR))

from anonimizar import AnonimizadorFacial

# =====================================
# INICIALIZAR APLICACION
# =====================================

app = FastAPI(title="Detector de Corbatas")

app.mount(
    "/static",
    StaticFiles(directory=APP_DIR / "static"),
    name="static"
)

print("===== CARGANDO MODELO YOLO =====")

modelo = YOLO(str(RUTA_MODELO))

print("¡Modelo YOLO cargado correctamente!")

print("===== INICIALIZANDO MEDIAPIPE =====")

anonimizador = AnonimizadorFacial()

print("¡Anonimizador facial cargado correctamente!")

# Bloqueos para proteger los modelos.
bloqueo_anonimizador = Lock()
bloqueo_yolo = Lock()

# =====================================
# FUNCIONES AUXILIARES
# =====================================

def leer_imagen(contenido):
    imagen_bytes = np.frombuffer(contenido, np.uint8)

    frame = cv2.imdecode(
        imagen_bytes,
        cv2.IMREAD_COLOR
    )

    return frame


def anonimizar_imagen(frame):
    with bloqueo_anonimizador:
        return anonimizador.anonimizar(frame.copy())


def codificar_jpeg(frame, calidad=75):
    correcto, buffer = cv2.imencode(
        ".jpg",
        frame,
        [cv2.IMWRITE_JPEG_QUALITY, calidad]
    )

    if not correcto:
        return None

    return buffer.tobytes()


# =====================================
# PAGINA PRINCIPAL
# =====================================

@app.get("/")
async def inicio():
    return FileResponse(APP_DIR / "templates" / "index.html")


# =====================================
# ANONIMIZACION INDEPENDIENTE
# =====================================

@app.post("/anonimizar")
async def anonimizar_fotograma(request: Request):

    contenido = await request.body()

    frame = leer_imagen(contenido)

    if frame is None:
        return {"error": "No se pudo leer el fotograma"}

    frame_anonimizado = anonimizar_imagen(frame)

    buffer = codificar_jpeg(frame_anonimizado, 75)

    if buffer is None:
        return {"error": "No se pudo generar la imagen anonimizada"}

    return {
        "imagen_anonimizada": base64.b64encode(
            buffer
        ).decode("utf-8"),
        "ancho": frame.shape[1],
        "alto": frame.shape[0],
        "anonimizado": True
    }


# =====================================
# DETECCION YOLO
# =====================================

@app.post("/detectar")
async def detectar(request: Request):

    contenido = await request.body()

    frame_anonimizado = leer_imagen(contenido)

    if frame_anonimizado is None:
        return {"error": "No se pudo leer el fotograma"}

    # Se espera una imagen previamente anonimizada.
    with bloqueo_yolo:
        resultados = modelo.predict(
            source=frame_anonimizado,
            imgsz=640,
            conf=0.15,
            device="cpu",
            verbose=False
        )

    detecciones = []

    for resultado in resultados:
        for caja in resultado.boxes:

            x1, y1, x2, y2 = caja.xyxy[0].tolist()

            detecciones.append({
                "clase": "corbata",
                "confianza": round(float(caja.conf[0]), 4),
                "x1": round(x1),
                "y1": round(y1),
                "x2": round(x2),
                "y2": round(y2)
            })

    return {
        "detecciones": detecciones,
        "ancho": frame_anonimizado.shape[1],
        "alto": frame_anonimizado.shape[0],
        "anonimizado": True
    }


# =====================================
# MODULO DE REDES LAN
# =====================================

@app.post("/red/medir")
async def medir_red(request: Request):

    # Inicio de la medición de recepción.
    inicio = perf_counter()

    contenido = await request.body()

    fin_recepcion = perf_counter()

    bytes_subida = len(contenido)

    tiempo_subida = fin_recepcion - inicio

    velocidad_subida = (
        (bytes_subida * 8) / tiempo_subida / 1_000_000
        if tiempo_subida > 0 else 0
    )

    # Respuesta de prueba para medir la descarga.
    respuesta_prueba = b"MEDICION_RED_LAN" * 4096

    bytes_descarga = len(respuesta_prueba)

    tiempo_procesamiento = (
        fin_recepcion - inicio
    )

    return Response(
        content=respuesta_prueba,
        media_type="application/octet-stream",
        headers={
            "X-Bytes-Subida": str(bytes_subida),
            "X-Bytes-Descarga": str(bytes_descarga),
            "X-Tiempo-Recepcion": str(tiempo_subida),
            "X-Velocidad-Subida-Mbps": str(round(velocidad_subida, 4)),
            "X-Tiempo-Procesamiento": str(tiempo_procesamiento)
        }
    )


# =====================================
# VERIFICACION DEL SERVIDOR
# =====================================

@app.get("/estado")
async def estado():
    return {
        "servidor": "activo",
        "modelo": "YOLOv8",
        "anonimizacion": "MediaPipe",
        "detector": "corbata",
        "modulo_red": "activo"
    }


# =====================================
# CERRAR RECURSOS
# =====================================

@app.on_event("shutdown")
def cerrar_recursos():

    with bloqueo_anonimizador:
        anonimizador.cerrar()

    print("Anonimizador facial cerrado correctamente.")