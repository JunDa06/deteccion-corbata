
import cv2
import mediapipe as mp


class AnonimizadorFacial:

    def __init__(self):
        self.detector = mp.solutions.face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=0.5
        )

    def anonimizar(self, imagen):

        imagen_rgb = cv2.cvtColor(
            imagen,
            cv2.COLOR_BGR2RGB
        )

        resultados = self.detector.process(imagen_rgb)

        if resultados.detections:

            alto, ancho = imagen.shape[:2]

            for deteccion in resultados.detections:

                caja = deteccion.location_data.relative_bounding_box

                x1 = max(0, int(caja.xmin * ancho))
                y1 = max(0, int(caja.ymin * alto))

                x2 = min(
                    ancho,
                    int((caja.xmin + caja.width) * ancho)
                )

                y2 = min(
                    alto,
                    int((caja.ymin + caja.height) * alto)
                )

                if x2 <= x1 or y2 <= y1:
                    continue

                rostro = imagen[y1:y2, x1:x2]

                rostro_desenfocado = cv2.GaussianBlur(
                    rostro,
                    (99, 99),
                    30
                )

                imagen[y1:y2, x1:x2] = rostro_desenfocado

        return imagen

    def cerrar(self):
        self.detector.close()
