# Detección de Corbata

Sistema de detección de corbatas mediante inteligencia artificial y visión artificial, desarrollado con YOLOv8, Python y FastAPI.

## Descripción

Este proyecto permite detectar en tiempo real si una persona lleva corbata utilizando una cámara conectada a una aplicación web.

El sistema utiliza YOLOv8 para reconocer las corbatas y MediaPipe para detectar los rostros y aplicarles desenfoque como medida de apoyo a la privacidad.

Además, cuenta con un dashboard que muestra los resultados de las detecciones y un módulo para monitorear la conexión de red.

## Tecnologías utilizadas

- Python 3.12
- YOLOv8
- PyTorch
- OpenCV
- MediaPipe
- FastAPI
- HTML, CSS y JavaScript
- Uvicorn
- mkcert

## Características principales

- Detección de corbatas en tiempo real.
- Visualización de resultados mediante una aplicación web.
- Desenfoque facial mediante MediaPipe.
- Acceso desde computadoras y celulares conectados a la misma red local.
- Comunicación mediante HTTPS.
- Monitoreo de latencia HTTP y rendimiento efectivo de transferencia de datos.

## Estructura del proyecto

```text
DETECCION_CORBATA/
│
├── app/
│   └── main.py
│
├── dataset/
│   └── data.yaml
│
├── runs/
│
├── README.md
├── .gitignore
└── requirements.txt
```

## Requisitos

- Python 3.12 o superior.
- Una cámara.
- Dispositivos conectados a la misma red local.
- Dependencias del proyecto instaladas.

## Instalación

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar a la carpeta:

```bash
cd deteccion-corbata
```

Crear un entorno virtual:

```bash
python -m venv venv
```

Activar el entorno virtual en Windows:

```powershell
venv\Scripts\activate
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

## Ejecución

Iniciar la aplicación con Uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Después, ingresar desde el navegador a la dirección configurada para acceder a la aplicación.

## Modelo

El sistema utiliza YOLOv8 entrenado para reconocer la clase `corbata`.

Los pesos del modelo (`best.pt`) deben estar disponibles en la ruta configurada por la aplicación.

## Autoría

Proyecto académico desarrollado como práctica de inteligencia artificial, visión artificial y desarrollo web.