import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

let servidorWebSocket;

export function iniciarWebSocketPedidos(server, origenesPermitidos) {
  if (servidorWebSocket) {
    throw new Error("El servidor WebSocket de pedidos ya está iniciado.");
  }

  const webSocketServer = new WebSocketServer({ noServer: true });
  servidorWebSocket = webSocketServer;

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost");

    if (url.pathname !== "/ws") {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    const origin = request.headers.origin;
    if (origin && !origenesPermitidos.has(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (cliente) => {
      webSocketServer.emit("connection", cliente, request);
    });
  });

  webSocketServer.on("connection", (cliente) => {
    let autenticado = false;
    const timeoutAutenticacion = setTimeout(() => {
      cliente.close(1008, "Autenticación requerida");
    }, 5000);

    cliente.on("message", (mensaje) => {
      if (autenticado) {
        return;
      }

      try {
        const solicitud = JSON.parse(mensaje.toString());
        const usuario = jwt.verify(
          solicitud.token,
          process.env.JWT_SECRET || ""
        );

        if (solicitud.tipo !== "AUTENTICAR" || usuario.rol !== "ADMIN") {
          cliente.close(1008, "Se requiere el rol de administrador");
          return;
        }

        autenticado = true;
        cliente.esAdministrador = true;
        clearTimeout(timeoutAutenticacion);
        cliente.send(JSON.stringify({ tipo: "CONECTADO" }));
      } catch {
        cliente.close(1008, "Credenciales no válidas");
      }
    });

    cliente.on("close", () => {
      clearTimeout(timeoutAutenticacion);
    });

    cliente.on("error", (error) => {
      console.error("Error en conexión WebSocket de pedidos:", error);
    });
  });

  webSocketServer.on("error", (error) => {
    console.error("Error en servidor WebSocket de pedidos:", error);
  });
}

export function publicarEventoPedido(tipo, datos) {
  if (!servidorWebSocket) {
    throw new Error("El servidor WebSocket de pedidos no está iniciado.");
  }

  const mensaje = JSON.stringify({ tipo, datos });

  for (const cliente of servidorWebSocket.clients) {
    if (cliente.esAdministrador && cliente.readyState === WebSocket.OPEN) {
      cliente.send(mensaje, (error) => {
        if (error) {
          console.error("No se pudo enviar una actualización de pedido:", error);
        }
      });
    }
  }
}
