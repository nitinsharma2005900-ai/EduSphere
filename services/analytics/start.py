"""Listen on IPv4 and IPv6 for Railway health checks and private networking."""
import os
import socket
import uvicorn

if __name__ == '__main__':
    port = int(os.getenv('PORT', '8000'))
    with socket.create_server(('::', port), family=socket.AF_INET6, dualstack_ipv6=True) as listener:
        uvicorn.run('app.main:app', fd=listener.fileno())
