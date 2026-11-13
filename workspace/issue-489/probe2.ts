import { inlineImageFor, isSingleImage, blobUrlFor } from "/home/runner/work/atomaton/atomaton/src/entrypoints/tools/mcp/attachments.ts";
for (const t of ["designs/12/a).png", "designs/12/a(1).png", "designs/12/shot.png", "a b/c#d.png"]) {
  const img = inlineImageFor("owner/repo", "business-docs", t)!;
  console.log(t, "->", img.markdown, "| isSingleImage:", isSingleImage(img.markdown, img.raw_url));
}
console.log("blob:", blobUrlFor("owner/repo", "business-docs", "designs/12/a(1).png"));
