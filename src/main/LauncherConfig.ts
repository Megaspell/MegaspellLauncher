import path from 'path';
import fs from 'fs';
import { appDir } from './util';

const ConfigFileName = 'config.json';

export default interface LauncherConfig {
  releasesRepository: string;
  githubToken?: string;
}

export function loadConfig(): LauncherConfig {
  const configPath = path.resolve(appDir, ConfigFileName);

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config file '${ConfigFileName}' is not found at ${appDir}`,
    );
  }

  const configText = fs.readFileSync(configPath, 'utf8');
  const config: LauncherConfig = JSON.parse(configText);
  if (config.releasesRepository == null) {
    throw new Error('repository property is not set');
  }

  return config;
}
