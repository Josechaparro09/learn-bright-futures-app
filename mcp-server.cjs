/**
 * Servidor MCP básico para desarrollo 
 * 
 * Este servidor simula un servidor MCP que puede ser utilizado durante el desarrollo.
 * Para ejecutarlo: node mcp-server.js
 */

const http = require('http');
const { spawn } = require('child_process');

// Configuración del servidor
const PORT = 3000;
const MCP_PATH = './src/mcp/index.ts';

// Crear servidor HTTP básico
const server = http.createServer((req, res) => {
  // Verificar que sea una solicitud POST al endpoint MCP
  if (req.method === 'POST' && req.url === '/mcp') {
    let body = '';
    
    // Recopilar datos del cuerpo de la solicitud
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    // Procesar la solicitud cuando se complete
    req.on('end', () => {
      try {
        // Convertir el cuerpo de la solicitud a JSON
        const requestData = JSON.parse(body);
        console.log('Solicitud MCP recibida:', JSON.stringify(requestData, null, 2));
        
        // Ejecutar el script MCP y pasar la solicitud
        const mcpProcess = spawn('node', [
          '-r', 
          'ts-node/register', 
          MCP_PATH
        ]);
        
        // Enviar la solicitud al proceso MCP
        mcpProcess.stdin.write(JSON.stringify(requestData) + '\n');
        
        let responseData = '';
        
        // Recopilar la salida del proceso MCP
        mcpProcess.stdout.on('data', (data) => {
          responseData += data.toString();
        });
        
        // Manejar errores del proceso MCP
        mcpProcess.stderr.on('data', (data) => {
          console.error('Error MCP:', data.toString());
        });
        
        // Cuando el proceso MCP termine, enviar la respuesta
        mcpProcess.on('close', (code) => {
          if (code === 0 && responseData) {
            // Establecer encabezados de respuesta
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            
            // Enviar respuesta
            res.end(responseData);
          } else {
            // Error en el proceso MCP
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: 'Error en el servidor MCP', 
              code 
            }));
          }
        });
      } catch (error) {
        // Error al procesar la solicitud
        console.error('Error al procesar la solicitud:', error);
        res.statusCode = 400;
        res.end(JSON.stringify({ 
          error: 'Solicitud inválida', 
          message: error.message 
        }));
      }
    });
  } else {
    // Endpoint no encontrado
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
  }
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor MCP ejecutándose en http://localhost:${PORT}/mcp`);
  console.log('Presiona Ctrl+C para detener el servidor');
}); 