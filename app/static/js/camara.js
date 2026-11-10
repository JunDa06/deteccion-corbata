
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const contexto = canvas.getContext("2d");

const btnIniciar = document.getElementById("btnIniciar");
const btnDetener = document.getElementById("btnDetener");

const estado = document.getElementById("estado");
const resultado = document.getElementById("resultado");

const estadoVestimenta = document.getElementById("estadoVestimenta");
const confianza = document.getElementById("confianza");
const totalDetecciones = document.getElementById("totalDetecciones");
const estadoPrivacidad = document.getElementById("estadoPrivacidad");

// Estado de la cámara y de los procesos
let flujoCamara = null;
let camaraActiva = false;

let procesandoAnonimizacion = false;
let procesandoDeteccion = false;

// Intervalos de trabajo
const INTERVALO_IMAGEN = 50;
const INTERVALO_DETECCION = 1000;

// Última imagen que MediaPipe ha anonimizado
let ultimaImagenAnonimizada = null;
let ultimoBlobAnonimizado = null;

// Detecciones más recientes de YOLO
let deteccionesActuales = [];

// Canvas auxiliar para capturar la cámara
const imagenCaptura = document.createElement("canvas");
const contextoCaptura = imagenCaptura.getContext("2d");

// Eventos
btnIniciar.addEventListener("click", iniciarCamara);
btnDetener.addEventListener("click", detenerCamara);


// =====================================
// INICIAR CÁMARA
// =====================================

async function iniciarCamara() {
    try {
        estado.textContent = "Solicitando acceso a la cámara...";

        flujoCamara = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        video.srcObject = flujoCamara;
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        imagenCaptura.width = video.videoWidth;
        imagenCaptura.height = video.videoHeight;

        camaraActiva = true;

        ultimaImagenAnonimizada = null;
        ultimoBlobAnonimizado = null;
        deteccionesActuales = [];

        btnIniciar.disabled = true;
        btnDetener.disabled = false;

        estado.textContent = "Cámara activa. Protegiendo imagen...";

        estadoVestimenta.textContent = "ANALIZANDO...";
        confianza.textContent = "0%";
        totalDetecciones.textContent = "0";
        estadoPrivacidad.textContent = "PROCESANDO";

        resultado.textContent = "Esperando detección...";

        // Iniciar los dos procesos independientes
        bucleAnonimizacion();
        programarDeteccion();

    } catch (error) {
        console.error("Error al iniciar la cámara:", error);
        estado.textContent = "No se pudo acceder a la cámara.";
    }
}


// =====================================
// DETENER CÁMARA
// =====================================

function detenerCamara() {
    camaraActiva = false;

    if (flujoCamara) {
        flujoCamara.getTracks().forEach(track => track.stop());
        flujoCamara = null;
    }

    video.srcObject = null;

    contexto.clearRect(0, 0, canvas.width, canvas.height);

    ultimaImagenAnonimizada = null;
    ultimoBlobAnonimizado = null;
    deteccionesActuales = [];

    btnIniciar.disabled = false;
    btnDetener.disabled = true;

    estado.textContent = "Cámara desactivada";
    resultado.textContent = "Esperando detección...";

    estadoVestimenta.textContent = "ESPERANDO...";
    confianza.textContent = "0%";
    totalDetecciones.textContent = "0";
    estadoPrivacidad.textContent = "INACTIVA";
}


// =====================================
// PROCESO 1: ANONIMIZACIÓN CONTINUA
// =====================================

async function bucleAnonimizacion() {
    if (!camaraActiva || procesandoAnonimizacion) return;

    procesandoAnonimizacion = true;

    try {
        if (video.readyState < 2) {
            return;
        }

        // Capturar imagen original en un canvas auxiliar.
        // Este canvas nunca se muestra en pantalla.

        contextoCaptura.drawImage(
            video,
            0,
            0,
            imagenCaptura.width,
            imagenCaptura.height
        );

        const imagenOriginal = await new Promise(resolve => {
            imagenCaptura.toBlob(resolve, "image/jpeg", 0.8);
        });

        if (!imagenOriginal) {
            throw new Error("No se pudo capturar la imagen");
        }

        if (!camaraActiva) return;

        // Enviar imagen al servicio MediaPipe.

        const respuesta = await fetch("/anonimizar", {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream"
            },
            body: imagenOriginal
        });

        if (!respuesta.ok) {
            throw new Error("Falló el servicio de anonimización");
        }

        const datos = await respuesta.json();

        if (datos.error || !datos.imagen_anonimizada) {
            throw new Error("No se recibió una imagen anonimizada");
        }

        if (!camaraActiva) return;

        // Convertir Base64 a Blob JPEG.

        const binario = atob(datos.imagen_anonimizada);
        const bytes = new Uint8Array(binario.length);

        for (let i = 0; i < binario.length; i++) {
            bytes[i] = binario.charCodeAt(i);
        }

        const blobAnonimizado = new Blob(
            [bytes],
            { type: "image/jpeg" }
        );

        // Crear imagen visual a partir del resultado protegido.

        const urlTemporal = URL.createObjectURL(blobAnonimizado);

        try {
            const imagenVisual = new Image();

            await new Promise((resolve, reject) => {
                imagenVisual.onload = resolve;
                imagenVisual.onerror = reject;
                imagenVisual.src = urlTemporal;
            });

            if (!camaraActiva) return;

            // Guardar únicamente el resultado anonimizado.

            ultimaImagenAnonimizada = imagenVisual;
            ultimoBlobAnonimizado = blobAnonimizado;

            // Mostrar imagen protegida.

            dibujarImagenProtegida();

            estadoPrivacidad.textContent = "ACTIVA";
            estado.textContent = "Cámara activa. Procesamiento local.";

        } finally {
            URL.revokeObjectURL(urlTemporal);
        }

    } catch (error) {
        console.error("Error de anonimización:", error);

        // Si falla MediaPipe, no mostrar la imagen original.

        contexto.clearRect(0, 0, canvas.width, canvas.height);

        ultimaImagenAnonimizada = null;
        ultimoBlobAnonimizado = null;

        estadoPrivacidad.textContent = "NO CONFIRMADA";
        estado.textContent = "Error al anonimizar la imagen";

    } finally {
        procesandoAnonimizacion = false;

        if (camaraActiva) {
            setTimeout(bucleAnonimizacion, INTERVALO_IMAGEN);
        }
    }
}


// =====================================
// DIBUJAR IMAGEN ANONIMIZADA
// =====================================

function dibujarImagenProtegida() {
    if (!camaraActiva || !ultimaImagenAnonimizada) {
        contexto.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    contexto.clearRect(0, 0, canvas.width, canvas.height);

    contexto.drawImage(
        ultimaImagenAnonimizada,
        0,
        0,
        canvas.width,
        canvas.height
    );

    dibujarDetecciones({
        detecciones: deteccionesActuales,
        ancho: canvas.width,
        alto: canvas.height
    });
}


// =====================================
// PROCESO 2: DETECCIÓN YOLO
// =====================================

async function programarDeteccion() {
    if (!camaraActiva) return;

    if (!procesandoDeteccion && ultimoBlobAnonimizado) {
        procesandoDeteccion = true;

        try {
            // YOLO recibe el Blob anonimizado,
            // nunca el fotograma original.

            const respuesta = await fetch("/detectar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream"
                },
                body: ultimoBlobAnonimizado
            });

            if (!respuesta.ok) {
                throw new Error("Error en el servicio YOLO");
            }

            const datos = await respuesta.json();

            if (datos.error) {
                throw new Error(datos.error);
            }

            if (!camaraActiva) return;

            deteccionesActuales = datos.detecciones || [];

            actualizarDashboard(datos);

            // Dibujar detecciones sobre la última imagen protegida.
            dibujarImagenProtegida();

        } catch (error) {
            console.error("Error de detección:", error);
            estado.textContent = "Error en el análisis YOLO";

        } finally {
            procesandoDeteccion = false;
        }
    }

    if (camaraActiva) {
        setTimeout(programarDeteccion, INTERVALO_DETECCION);
    }
}


// =====================================
// ACTUALIZAR DASHBOARD
// =====================================

function actualizarDashboard(datos) {
    const detecciones = datos.detecciones || [];
    const cantidad = detecciones.length;

    const tarjetaEstado = estadoVestimenta.closest(".tarjeta");

    totalDetecciones.textContent = cantidad;

    tarjetaEstado.classList.remove(
        "alerta-verde",
        "alerta-roja",
        "alerta-neutra"
    );

    if (cantidad > 0) {
        // ALERTA VERDE: CON CORBATA

        estadoVestimenta.textContent = "CON CORBATA";
        tarjetaEstado.classList.add("alerta-verde");

        const mayorConfianza = Math.max(
            ...detecciones.map(d => d.confianza)
        );

        confianza.textContent =
            `${Math.round(mayorConfianza * 100)}%`;

        resultado.textContent =
            `Se detectaron ${cantidad} corbata(s).`;

    } else {
        // ALERTA ROJA: SIN CORBATA

        estadoVestimenta.textContent = "SIN CORBATA";
        tarjetaEstado.classList.add("alerta-roja");

        confianza.textContent = "0%";

        resultado.textContent =
            "No se detectaron corbatas.";
    }

    estadoPrivacidad.textContent =
        datos.anonimizado ? "ACTIVA" : "NO CONFIRMADA";
}


// =====================================
// DIBUJAR DETECCIONES
// =====================================

function dibujarDetecciones(datos) {
    if (!datos.detecciones || datos.detecciones.length === 0) {
        return;
    }

    const escalaX = canvas.width / datos.ancho;
    const escalaY = canvas.height / datos.alto;

    datos.detecciones.forEach(deteccion => {
        const x = deteccion.x1 * escalaX;
        const y = deteccion.y1 * escalaY;

        const ancho = (deteccion.x2 - deteccion.x1) * escalaX;
        const alto = (deteccion.y2 - deteccion.y1) * escalaY;

        contexto.strokeStyle = "#22c55e";
        contexto.lineWidth = 4;
        contexto.strokeRect(x, y, ancho, alto);

        contexto.fillStyle = "#22c55e";
        contexto.font = "bold 18px Arial";

        contexto.fillText(
            `Corbata ${Math.round(deteccion.confianza * 100)}%`,
            x,
            Math.max(y - 8, 20)
        );
    });
}
