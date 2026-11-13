import { inlineImageFor, isSingleImage } from "/home/runner/work/atomaton/atomaton/src/entrypoints/tools/mcp/attachments.ts";
const img = inlineImageFor("owner/repo", "business-docs", "designs/12/a).png")!;
console.log("markdown:", img.markdown);
console.log("isSingleImage says:", isSingleImage(img.markdown, img.raw_url));
console.log("raw_url   :", img.raw_url);
