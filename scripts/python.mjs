import { spawn } from 'node:child_process';
const action = process.argv[2];
const args = action === 'dev' ? ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'] : ['-m', 'pytest', 'tests/', '-v'];
const child = spawn(process.env.PYTHON || 'python', args, { cwd: new URL('../services/analytics/', import.meta.url), stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => { console.error(error.message); process.exit(1); });
