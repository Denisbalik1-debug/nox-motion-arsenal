import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

const denied = () => {
  throw new Error('NETWORK_DISABLED_BY_NOX_COMPILER');
};

globalThis.fetch = denied;
http.request = denied;
http.get = denied;
https.request = denied;
https.get = denied;
net.connect = denied;
net.createConnection = denied;
dns.lookup = denied;
dns.resolve = denied;
