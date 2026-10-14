import type { Client } from '@notionhq/client';
import { notionRequest } from './client';

/**
 * Turns a database id into the data source id the query API now needs.
 *
 * Since Notion API 2025-09-03 a database is a *container* for one or more data
 * sources, and queries run against a data source. Env vars still hold database
 * ids because that is what a person can copy out of the Notion address bar;
 * this is where the translation happens, once, at build time.
 */
export async function resolveDataSourceId(
  client: Client,
  databaseId: string,
  label: string
): Promise<string> {
  const database = await notionRequest(() =>
    client.databases.retrieve({ database_id: databaseId })
  );

  // Notion returns a partial object when the integration can see that the
  // database exists but has not been granted access to it.
  if (!('data_sources' in database)) {
    throw new Error(
      `${label}: Notion returned a partial database object for ${databaseId}. ` +
        'Share the database with the integration: open it in Notion, then ... -> Connections.'
    );
  }

  const sources = database.data_sources;
  const first = sources?.[0];

  if (!first) {
    throw new Error(`${label}: database ${databaseId} reports no data sources.`);
  }

  if (sources.length > 1) {
    console.warn(
      `  ${label}: database has ${sources.length} data sources; using "${first.name}". ` +
        'If that is the wrong one, the build needs to name it explicitly.'
    );
  }

  return first.id;
}
