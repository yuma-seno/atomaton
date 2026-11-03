/**
 * doc-template-rows.test.ts — the default Word template keeps every row whole,
 * and repeats the header row of a table that runs onto the next page.
 *
 * Both are one attribute each away from being lost, and neither loss shows in the
 * template: the XML stays valid and the short tables in the default report fit on
 * one page either way, so the defect appears only in a document long enough to
 * split. What arrives then is a docx with no `w:cantSplit` and no `w:tblHeader`.
 *
 * The attribute that looks like it should do this does not: measured on a 150-row
 * table, `style:may-break-between-rows="false"` on the table exported `w:keepNext`
 * and no `w:cantSplit` at all. So the two attributes checked here are the ones the
 * template has to keep, and the check is on the source because a conversion cannot
 * run in this suite — LibreOffice is installed on demand by `docs/customer-doc`
 * and is deliberately absent from `environment.setup_commands`.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const TEMPLATE = "src/content/skills/docs/templates/report.fodt";

describe("the default Word template's tables", () => {
  const xml = readFileSync(TEMPLATE, "utf8");

  test("every row names a row style that keeps the row whole", () => {
    const rows = [...xml.matchAll(/<table:table-row\b[^>]*>/g)].map((match) => match[0]!);
    // Without this the loop below passes on a file whose tables were all renamed.
    expect(rows.length, `${TEMPLATE} must still contain table rows`).toBeGreaterThan(0);

    for (const row of rows) {
      const style = row.match(/table:style-name="([^"]+)"/)?.[1];
      expect(style, `a row with no style may split mid-row: ${row}`).toBeTruthy();

      const declaration = xml.match(new RegExp(`<style:style style:name="${style}" style:family="table-row">([\\s\\S]*?)</style:style>`))?.[1];
      expect(declaration, `row style "${style}" must be declared as a table-row style`).toBeTruthy();
      expect(declaration!, `row style "${style}" must carry fo:keep-together="always", or its rows split`).toContain('fo:keep-together="always"');
    }
  });

  test("a table with a header row repeats it on the next page", () => {
    const tables = [...xml.matchAll(/<table:table\b[\s\S]*?<\/table:table>/g)].map((match) => match[0]!);
    expect(tables.length, `${TEMPLATE} must still contain tables`).toBeGreaterThan(0);

    let withHeader = 0;
    for (const table of tables) {
      const firstRow = table.match(/<table:table-row\b[^>]*>[\s\S]*?<\/table:table-row>/)?.[0] ?? "";
      // A label/value table such as the title page's Meta has no header row to repeat.
      if (!firstRow.includes('table:style-name="CellHead"')) continue;
      withHeader += 1;
      expect(table, "a header row outside table:table-header-rows never repeats").toMatch(/<table:table-header-rows>\s*<table:table-row\b/);
    }

    expect(withHeader, "no table declared a header row; check the CellHead style name").toBeGreaterThan(0);
  });
});
