// Zips the contents of dist/ (not the folder itself) into applane-site.zip,
// ready to upload and extract into public_html on cPanel / Hostinger.
// Run: npm run zip   (builds first)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';

const out = 'applane-site.zip';
if (!existsSync('dist/index.html')) throw new Error('dist/ is missing. Run `npm run build` first.');
if (!existsSync('dist/.htaccess')) throw new Error('dist/.htaccess is missing. Check public/.htaccess.');
rmSync(out, { force: true });

// List top-level entries so the zip has no "dist/" or "./" prefix.
const entries = readdirSync('dist');
if (process.platform === 'win32') {
  // Windows' built-in bsdtar writes proper zips with forward-slash paths.
  execFileSync('C:\\Windows\\System32\\tar.exe', ['-a', '-c', '-f', `../${out}`, ...entries], { cwd: 'dist', stdio: 'inherit' });
} else {
  execFileSync('zip', ['-r', '-q', `../${out}`, ...entries], { cwd: 'dist', stdio: 'inherit' });
}
console.log(`Created ${out} with ${entries.length} top-level items (including .htaccess).`);
