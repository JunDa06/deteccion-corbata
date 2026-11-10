
from pathlib import Path
import random
import shutil

BASE = Path("dataset")
random.seed(42)

DISTRIBUCION = {
    "train": 35,
    "val": 10,
    "test": 5
}

def distribuir_imagenes(categoria, prefijo, tiene_etiquetas):
    origen = BASE / "images" / categoria
    imagenes = sorted(origen.glob("*.jpg"))

    if len(imagenes) != 50:
        raise ValueError(
            f"Se esperaban 50 imágenes en {origen}, "
            f"pero se encontraron {len(imagenes)}."
        )

    random.shuffle(imagenes)
    inicio = 0

    for conjunto, cantidad in DISTRIBUCION.items():
        seleccion = imagenes[inicio:inicio + cantidad]
        inicio += cantidad

        for imagen in seleccion:
            nombre_nuevo = prefijo + imagen.stem

            destino_imagen = BASE / "images" / conjunto
            destino_imagen.mkdir(parents=True, exist_ok=True)

            shutil.copy2(
                imagen,
                destino_imagen / f"{nombre_nuevo}.jpg"
            )

            if tiene_etiquetas:
                etiqueta = BASE / "labels" / f"{imagen.stem}.txt"

                if not etiqueta.exists():
                    raise FileNotFoundError(
                        f"No se encontró la etiqueta: {etiqueta}"
                    )

                destino_etiqueta = BASE / "labels" / conjunto
                destino_etiqueta.mkdir(parents=True, exist_ok=True)

                shutil.copy2(
                    etiqueta,
                    destino_etiqueta / f"{nombre_nuevo}.txt"
                )

        print(f"{conjunto}: {len(seleccion)} imágenes de {categoria}")

distribuir_imagenes("con_corbata", "con_", True)
distribuir_imagenes("sin_corbata", "sin_", False)

print("\n¡Distribución terminada correctamente!")
