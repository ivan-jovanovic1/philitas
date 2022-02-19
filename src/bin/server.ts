import app from "../app";
import debugLib from "debug";
import http from "http";

/**
 * Normalize a port into a number, string, or false.
 */

const normalizePort = (value: string) => {
  const port = parseInt(value, 10);

  if (isNaN(port)) return value;

  return port;
};

/**
 * Event listener for HTTP server "error" event.
 */

const onError = (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") throw error;

  let bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exitCode = 1;
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exitCode = 1;
      break;
    default:
      throw error;
  }
};

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = () => {
  const addr = server.address();
  let bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);
};

const debug = debugLib("philitas:server");
/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3002");
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
server.on("error", onError);
server.on("listening", onListening);
