import Resolution from '../Resolution';
import * as fs from 'fs';
import { ResolutionErrorCode } from '../errors/resolutionError';

export async function tryInfo(
  method: () => any,
  response: Record<string, string>,
  name: string,
): Promise<boolean> {
  const field = name;
  try {
    const resolvedPromise = await method();
    response[field] = resolvedPromise;
    return true;
  } catch (err) {
    if (Object.values(ResolutionErrorCode).includes(err.code)) {
      response[field] = err.code;
    } else {
      response[field] = err.message
    }
    return false;
  }
}

export function commaSeparatedList(value: string, dummyPrevious: unknown): string[] {
  return value.split(',').map((v: string) => v.toUpperCase());
}

export function signedInfuraLink(key: string): string {
  return `https://mainnet.infura.io/v3/${key}`;
}


const configObject = getConfig();
export function getEthereumUrl(): string {
  switch (configObject.type) {
  case 'infura':
    return signedInfuraLink(configObject.value);
  case 'url':
    return configObject.value;
  default:
    return 'https://main-rpc.linkpool.io/';
  }
}

export function buildResolutionPackage(): Resolution {
  return new Resolution({
    blockchain: {
      ens: getEthereumUrl(),
      cns: getEthereumUrl(),
    },
  });
}

type Config = {type: string, value: string};
export function parseConfig(value: string): Config {
  const words = value.split(':');
  return { type: words[0], value: words.slice(1).join(':')};
}

export function storeConfig(type: 'infura' | 'url', value: string): void {
  // eslint-disable-next-line no-undef
  fs.writeFile(`${process.env.HOME}/.resolution`, `${type}=${value}`, () =>
    console.log(`${type}=${value} record stored`),
  );
}

export function getConfig(): Config {
  try {
    const config = fs
      // eslint-disable-next-line no-undef
      .readFileSync(`${process.env.HOME}/.resolution`)
      .toString()
      .split('=');
    return { type: config[0], value: config[1] };
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('Configuration file was not found. Default blockchain provider: "https://main-rpc.linkpool.io/" is being used');
      console.warn('This RPC is limited to 2,000 calls per 5 minutes. If that is exceeded, then the source IP address is blocked.');
      console.warn('To configure a different provider use -C flag ');
    }
    return {type: 'unknown', value: ''};
  }
}
