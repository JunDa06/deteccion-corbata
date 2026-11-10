
from pathlib import Path

carpeta = Path("dataset/labels")
errores = []
total = 0

for conjunto in ["train", "val", "test"]:
    etiquetas = list((carpeta / conjunto).glob("*.txt"))

    for archivo in etiquetas:
        total += 1

        for numero_linea, linea in enumerate(
            archivo.read_text().splitlines(), start=1
        ):
            valores = linea.split()

            if len(valores) != 5:
                errores.append(
                    f"{archivo.name}: línea {numero_linea}, "
                    "debe tener 5 valores"
                )
                continue

            try:
                clase = int(valores[0])
                coordenadas = [float(x) for x in valores[1:]]
            except ValueError:
                errores.append(f"{archivo.name}: valores no numéricos")
                continue

            if clase != 0:
                errores.append(f"{archivo.name}: clase incorrecta")

            if any(x < 0 or x > 1 for x in coordenadas):
                errores.append(f"{archivo.name}: coordenadas fuera de rango")

print("===== RESULTADO DE VALIDACIÓN =====")
print("Archivos revisados:", total)

if errores:
    print("Se encontraron errores:")
    for error in errores:
        print("-", error)
else:
    print("Todas las etiquetas son válidas.")
