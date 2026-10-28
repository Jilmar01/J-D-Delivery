import net from "node:net";

// Cliente del servidor TCP de concurrencia (concurrency-tcp-service).
// Envía un mensaje JSON por línea y devuelve la primera respuesta.
// TCP_HOST / TCP_PORT se leen en cada llamada (después de dotenv.config()).
export function enviarMensajeTcp(
  mensaje,
  {
    host = process.env.TCP_HOST || "localhost",
    port = Number(process.env.TCP_PORT) || 12345,
    timeoutMs = 5000,
  } = {}
) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host);
    let buffer = "";

    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      reject(new Error(`Tiempo de espera agotado conectando a ${host}:${port}`));
    });

    socket.on("connect", () => socket.write(JSON.stringify(mensaje) + "\n"));

    socket.on("data", (datos) => {
      buffer += datos.toString();
      const fin = buffer.indexOf("\n");
      if (fin === -1) return;

      socket.end();
      try {
        resolve(JSON.parse(buffer.slice(0, fin)));
      } catch {
        reject(new Error("Respuesta no válida del servidor TCP"));
      }
    });

    socket.on("error", reject);
  });
}
