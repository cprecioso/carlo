import slugify from "@sindresorhus/slugify";
import makeEnvPaths from "env-paths";
import * as path from "node:path";
import * as pptr from "puppeteer";
import { wrapFetch } from "./lib/fetch";

export const launch = async (
  fetch: (request: Request) => Response | Promise<Response>,
  {
    appName: rawAppName = crypto.randomUUID(),
    loadingPage,
    icon,
    startingUrl: startingPath = "/",
    windowOptions,
  }: {
    appName?: string;
    loadingPage?: string;
    icon?: { image?: Buffer; label?: string };
    startingUrl?: string;
    windowOptions?: {
      title?: string;
      position?: [x: number, y: number];
      size?: [width: number, height: number];
      backgroundColor?: string;
    };
  } = {},
) => {
  const name = slugify(rawAppName);
  const hostname = `${name}.localhost`;
  const startingUrl = new URL(startingPath, `http://${hostname}/`).href;
  const hostnamePattern = `*://${hostname}/*`;

  const processRequest = wrapFetch(fetch);

  const envPaths = makeEnvPaths(name);

  const loadingUrl = loadingPage
    ? `data:text/html,${encodeURIComponent(loadingPage)}`
    : "about:blank";

  const browser = await pptr.launch({
    headless: false,
    allowlist: [hostnamePattern],
    pipe: true,
    defaultViewport: null,
    userDataDir: path.join(envPaths.cache, "chrome-user-data"),
    args: [
      `--app=${loadingUrl}`,
      windowOptions?.title && `--window-title=${windowOptions.title}`,
      windowOptions?.position &&
        `--window-position=${windowOptions.position.join(",")}`,
      windowOptions?.size && `--window-size=${windowOptions.size.join(",")}`,
      windowOptions?.backgroundColor &&
        `--default-background-color=${windowOptions.backgroundColor}`,
    ].filter(Boolean) as string[],
  });

  const page = (await browser.pages()).at(0) || (await browser.newPage());
  page.on("close", () => browser.close());

  page.setRequestInterception(true);
  page.on(
    "request",
    async (request) => await request.respond(await processRequest(request)),
  );

  if (icon) {
    const session = await page.createCDPSession();
    await session.send("Browser.setDockTile", {
      image: icon?.image?.toString("base64"),
      badgeLabel: icon?.label,
    });
  }

  await page.goto(startingUrl);
};
