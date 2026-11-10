
// =====================================
// MODULO DE MONITOREO DE RED LAN
// =====================================

const estadoRed = document.getElementById("estadoRed");
const latenciaRed = document.getElementById("latenciaRed");
const anchoBanda = document.getElementById("anchoBanda");

let medicionRedActiva = false;

// Tamaño de los datos de prueba enviados al servidor.
const TAMANO_PRUEBA = 256 * 1024;

// Intervalo entre mediciones.
const INTERVALO_RED = 3000;

// =====================================
// MEDIR COMUNICACION CON FASTAPI
// =====================================

async function medirRed() {

    if (medicionRedActiva) return;

    medicionRedActiva = true;

    try {

        // Generar datos de prueba.
        const datosPrueba = new Uint8Array(TAMANO_PRUEBA);

        // Registrar inicio de la petición.
        const inicio = performance.now();

        const respuesta = await fetch("/red/medir", {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream"
            },
            body: datosPrueba
        });

        if (!respuesta.ok) {
            throw new Error("Error al medir la red");
        }

        // Recibir completamente la respuesta.
        const datosRespuesta = await respuesta.arrayBuffer();

        const fin = performance.now();

        // Latencia HTTP de ida y vuelta.
        const latencia = fin - inicio;

        // Tamaños reales transferidos.
        const bytesSubida = datosPrueba.byteLength;
        const bytesDescarga = datosRespuesta.byteLength;

        // Tiempo total expresado en segundos.
        const tiempoTotal = (fin - inicio) / 1000;

        // Velocidad efectiva de transferencia.
        const velocidad = (
            (bytesSubida + bytesDescarga) * 8
        ) / tiempoTotal / 1000000;

        // Actualizar dashboard.
        estadoRed.textContent = "CONECTADA";
        estadoRed.style.color = "#22c55e";

        latenciaRed.textContent =
            `${latencia.toFixed(2)} ms`;

        anchoBanda.textContent =
            `${velocidad.toFixed(2)} Mbps`;

    } catch (error) {

        console.error("Error en el módulo de red:", error);

        estadoRed.textContent = "DESCONECTADA";
        estadoRed.style.color = "#ef4444";

        latenciaRed.textContent = "-- ms";
        anchoBanda.textContent = "-- Mbps";

    } finally {

        medicionRedActiva = false;

        setTimeout(medirRed, INTERVALO_RED);

    }
}

// =====================================
// INICIAR MONITOREO
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    estadoRed.textContent = "CONECTANDO...";

    medirRed();

});
