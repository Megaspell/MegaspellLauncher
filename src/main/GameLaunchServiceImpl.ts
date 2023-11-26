// eslint-disable-next-line camelcase
import child_process from 'child_process';
import { ChildProcess } from 'node:child_process';
import EventEmitter from 'node:events';
import { ipcMain } from 'electron';
import path from 'path';
import GameLaunchService, {
  LaunchGameChannel,
} from '../common/GameLaunchService';
import { currentGameTarget, installPath } from './util';
import GameTarget from '../common/GameTarget';

export default class GameLaunchServiceImpl implements GameLaunchService {
  private currentGameProcess?: ChildProcess;

  constructor() {
    this.registerIpc();
  }

  async launchGame() {
    if (this.currentGameProcess && !this.currentGameProcess.exitCode) {
      // Already launched, do nothing
      return;
    }

    const executablePath = path.resolve(
      installPath,
      GameLaunchServiceImpl.getExecutableName(),
    );

    const bus = new EventEmitter();

    // eslint-disable-next-line camelcase
    this.currentGameProcess = child_process.execFile(executablePath);

    this.currentGameProcess.on('exit', () => {
      this.currentGameProcess = null as ChildProcess;
      bus.emit('exit');
    });

    await new Promise((resolve) => {
      bus.once('exit', resolve);
    });
  }

  private registerIpc() {
    ipcMain.handle(LaunchGameChannel, async () => {
      return this.launchGame();
    });
  }

  private static getExecutableName(): string {
    switch (currentGameTarget) {
      case GameTarget.PlayerWindows64:
        return 'Megaspell.exe';
      case GameTarget.PlayerLinux64:
      case GameTarget.ServerLinux64:
        return 'Megaspell';
      default:
        throw new Error(`Unsupported target: ${currentGameTarget}`);
    }
  }
}
