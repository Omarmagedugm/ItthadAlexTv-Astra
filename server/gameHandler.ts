import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const GAME_DIR = path.resolve(process.cwd(), 'public/games/ittihadawy');
const DIST_GAME_DIR = path.resolve(process.cwd(), 'dist/games/ittihadawy');
const BACKUPS_DIR = path.resolve(process.cwd(), 'public/games/.backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(filename: string): 'html' | 'js' | 'css' | 'audio' | 'image' | 'font' | 'other' {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.html') return 'html';
  if (ext === '.js' || ext === '.mjs') return 'js';
  if (ext === '.css') return 'css';
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return 'audio';
  if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico'].includes(ext)) return 'image';
  if (['.ttf', '.woff', '.woff2', '.otf', '.eot'].includes(ext)) return 'font';
  return 'other';
}

interface GameFileInfo {
  path: string;
  size: number;
  formattedSize: string;
  type: 'html' | 'js' | 'css' | 'audio' | 'image' | 'font' | 'other';
  lastModified: string;
}

function getAllFiles(dir: string, baseDir: string = dir): GameFileInfo[] {
  if (!fs.existsSync(dir)) return [];
  let results: GameFileInfo[] = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item.startsWith('.')) continue; // ignore hidden/system files
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({
        path: relPath,
        size: stat.size,
        formattedSize: formatBytes(stat.size),
        type: getFileType(item),
        lastModified: stat.mtime.toISOString()
      });
    }
  }
  return results;
}

export function getGameInfo() {
  if (!fs.existsSync(GAME_DIR)) {
    return {
      exists: false,
      gameDir: GAME_DIR,
      fileCount: 0,
      totalSize: 0,
      formattedSize: '0 B',
      lastModified: new Date().toISOString(),
      files: [],
      backups: []
    };
  }

  const files = getAllFiles(GAME_DIR);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  let newestMtime = 0;
  for (const f of files) {
    const t = new Date(f.lastModified).getTime();
    if (t > newestMtime) newestMtime = t;
  }

  // Read backups
  const backups: Array<{ id: string; filename: string; size: number; formattedSize: string; createdAt: string }> = [];
  if (fs.existsSync(BACKUPS_DIR)) {
    const backupFiles = fs.readdirSync(BACKUPS_DIR);
    for (const b of backupFiles) {
      if (b.endsWith('.zip')) {
        const fullBPath = path.join(BACKUPS_DIR, b);
        const stat = fs.statSync(fullBPath);
        backups.push({
          id: b,
          filename: b,
          size: stat.size,
          formattedSize: formatBytes(stat.size),
          createdAt: stat.mtime.toISOString()
        });
      }
    }
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return {
    exists: true,
    gameDir: 'public/games/ittihadawy',
    fileCount: files.length,
    totalSize,
    formattedSize: formatBytes(totalSize),
    lastModified: newestMtime ? new Date(newestMtime).toISOString() : new Date().toISOString(),
    files,
    backups
  };
}

export async function createGameZipBuffer(): Promise<{ buffer: Buffer; filename: string; size: number }> {
  if (!fs.existsSync(GAME_DIR)) {
    throw new Error('Game directory not found: public/games/ittihadawy');
  }

  const zip = new JSZip();

  function addDirToZip(currentDir: string, zipFolder: JSZip) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (item.startsWith('.')) continue;
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const sub = zipFolder.folder(item);
        if (sub) addDirToZip(fullPath, sub);
      } else {
        const data = fs.readFileSync(fullPath);
        zipFolder.file(item, data);
      }
    }
  }

  addDirToZip(GAME_DIR, zip);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `ittihadawy-escape-game-${dateStr}.zip`;

  return {
    buffer,
    filename,
    size: buffer.length
  };
}

export async function createBackup(note?: string) {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const { buffer } = await createGameZipBuffer();
  const timestamp = Date.now();
  const backupName = `backup-${timestamp}${note ? '-' + note.replace(/[^a-zA-Z0-9_-]/g, '_') : ''}.zip`;
  const backupPath = path.join(BACKUPS_DIR, backupName);

  fs.writeFileSync(backupPath, buffer);

  // Prune old backups if more than 15
  try {
    const list = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip'));
    if (list.length > 15) {
      const sorted = list.map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
      })).sort((a, b) => b.time - a.time);

      for (let i = 15; i < sorted.length; i++) {
        fs.unlinkSync(path.join(BACKUPS_DIR, sorted[i].name));
      }
    }
  } catch (err) {
    console.warn('[Game Backup] Could not prune old backups:', err);
  }

  return {
    id: backupName,
    filename: backupName,
    size: buffer.length,
    formattedSize: formatBytes(buffer.length),
    createdAt: new Date(timestamp).toISOString()
  };
}

export async function extractAndDeployGameZip(zipBuffer: Buffer): Promise<{
  success: boolean;
  filesCount: number;
  totalSize: number;
  backupId: string;
}> {
  // 1. Automatically create backup of current game before applying changes
  let backupInfo: any = null;
  try {
    if (fs.existsSync(GAME_DIR) && fs.readdirSync(GAME_DIR).length > 0) {
      backupInfo = await createBackup('pre-update');
    }
  } catch (err) {
    console.warn('[Game Deploy] Could not create pre-update backup:', err);
  }

  // 2. Load zip
  const zip = await JSZip.loadAsync(zipBuffer);

  // 3. Inspect entries & check for index.html
  const entries: string[] = [];
  zip.forEach((relPath) => {
    entries.push(relPath);
  });

  if (entries.length === 0) {
    throw new Error('الملف المضغوط فارغ تماماً');
  }

  // Detect if all files are inside a common root directory (e.g., 'ittihadawy/' or 'dist/')
  let prefixToStrip = '';
  const hasRootIndex = entries.some(e => e === 'index.html' || e === './index.html');

  if (!hasRootIndex) {
    // Check if there is an index.html nested in a top folder (e.g., "ittihadawy/index.html")
    const indexEntry = entries.find(e => e.endsWith('index.html') && e.split('/').length <= 3);
    if (indexEntry) {
      const parts = indexEntry.split('/');
      parts.pop(); // remove index.html
      prefixToStrip = parts.join('/') + '/';
    } else {
      throw new Error('الملف المضغوط لا يحتوي على ملف index.html الرئيسي للعبة');
    }
  }

  // 4. Ensure destination directories exist
  if (!fs.existsSync(GAME_DIR)) {
    fs.mkdirSync(GAME_DIR, { recursive: true });
  }

  const mirrorToDist = fs.existsSync(DIST_GAME_DIR);

  let filesCount = 0;
  let totalExtractedSize = 0;

  for (const entryPath of entries) {
    const zipEntry = zip.file(entryPath);
    if (!zipEntry) continue; // it is a directory or null

    let targetRelPath = entryPath;
    if (prefixToStrip && targetRelPath.startsWith(prefixToStrip)) {
      targetRelPath = targetRelPath.substring(prefixToStrip.length);
    }

    // Security check: no path traversal
    if (targetRelPath.includes('..') || path.isAbsolute(targetRelPath)) {
      continue;
    }

    const destPath = path.join(GAME_DIR, targetRelPath);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const buffer = await zipEntry.async('nodebuffer');
    fs.writeFileSync(destPath, buffer);
    filesCount++;
    totalExtractedSize += buffer.length;

    // Also mirror to dist if present for immediate live runtime update
    if (mirrorToDist) {
      const distDestPath = path.join(DIST_GAME_DIR, targetRelPath);
      const distDestDir = path.dirname(distDestPath);
      if (!fs.existsSync(distDestDir)) {
        fs.mkdirSync(distDestDir, { recursive: true });
      }
      fs.writeFileSync(distDestPath, buffer);
    }
  }

  return {
    success: true,
    filesCount,
    totalSize: totalExtractedSize,
    backupId: backupInfo?.id || ''
  };
}

export async function restoreGameBackup(backupId: string) {
  // Security: Prevent path traversal on backupId
  const cleanId = path.basename(backupId);
  const backupFilePath = path.join(BACKUPS_DIR, cleanId);

  if (!fs.existsSync(backupFilePath)) {
    throw new Error('ملف النسخة الاحتياطية غير موجود: ' + cleanId);
  }

  const zipBuffer = fs.readFileSync(backupFilePath);
  return await extractAndDeployGameZip(zipBuffer);
}

export function deleteGameBackup(backupId: string) {
  const cleanId = path.basename(backupId);
  const backupFilePath = path.join(BACKUPS_DIR, cleanId);

  if (fs.existsSync(backupFilePath)) {
    fs.unlinkSync(backupFilePath);
    return true;
  }
  return false;
}
