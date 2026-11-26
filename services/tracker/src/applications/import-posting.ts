import { ImportError } from "./posting-import/errors.js";
import { fetchPage } from "./posting-import/fetch-page.js";
import { linkedInJobUrl, parsePosting } from "./posting-import/parse-posting.js";

export { ImportError, linkedInJobUrl, parsePosting };

export async function importPosting(sourceUrl: string) {
  const url = new URL(sourceUrl);
  try {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      throw new ImportError("Enter a public HTTP or HTTPS job URL.");
    }
    const linkedInUrl = linkedInJobUrl(url);
    return parsePosting(await fetchPage(linkedInUrl ?? url), url.href);
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(
      "Could not fetch the job page. Check the URL or enter the details manually.",
    );
  }
}
