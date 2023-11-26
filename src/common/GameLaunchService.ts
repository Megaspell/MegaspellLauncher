export const LaunchGameChannel = 'launchApi.launchGame';

export default interface GameLaunchService {
  launchGame(): Promise<void>;
}
