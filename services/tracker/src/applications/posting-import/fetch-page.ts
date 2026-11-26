import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { ImportError } from "./errors.js";

const maxBytes = 2 * 1024 * 1024;

function publicAddress(address: string) {
  return ipaddr.process(address).range() === "unicast";
}

export async function fetchPage(url: URL, redirects = 0): Promise<string> {
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new ImportError("Enter a public HTTP or HTTPS job URL.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true });
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicAddress(address))
  ) {
    throw new ImportError("The job URL must point to a public address.");
  }
  const selected = addresses[0];
  return new Promise((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const request = send(
      url,
      {
        headers: {
          "user-agent": "JobTracker/1.0",
          accept: "text/html,application/xhtml+xml",
        },
        family: selected.family,
        lookup: (_hostname, _options, callback) =>
          callback(null, selected.address, selected.family),
        signal: AbortSignal.timeout(10000),
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (
          [301, 302, 303, 307, 308].includes(status) &&
          response.headers.location
        ) {
          response.resume();
          if (redirects >= 5)
            return reject(new ImportError("Too many redirects."));
          let next: URL;
          try {
            next = new URL(response.headers.location, url);
          } catch {
            return reject(
              new ImportError("The job site returned an invalid redirect."),
            );
          }
          return fetchPage(next, redirects + 1).then(resolve, reject);
        }
        if (status < 200 || status >= 300) {
          response.resume();
          if (
            status === 429 &&
            (url.hostname === "linkedin.com" ||
              url.hostname.endsWith(".linkedin.com"))
          ) {
            return reject(
              new ImportError(
                "LinkedIn is temporarily limiting requests. Try again later or paste the job description.",
              ),
            );
          }
          return reject(
            new ImportError(`The job site returned HTTP ${status}.`),
          );
        }
        if (
          !/^\s*(text\/html|application\/xhtml\+xml)(?:\s*;|\s*$)/i.test(
            response.headers["content-type"] ?? "",
          )
        ) {
          response.resume();
          return reject(
            new ImportError("The URL did not return an HTML page."),
          );
        }
        let size = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            response.destroy(new ImportError("The job page is too large."));
          } else {
            chunks.push(chunk);
          }
        });
        response.on("error", reject);
        response.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf8")),
        );
      },
    );
    request.on("error", reject);
    request.end();
  });
}
