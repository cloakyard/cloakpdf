import { expect, it } from "vite-plus/test";
import { EditorHistory } from "../../src/editor/history.ts";

it("repairs previews across undo/redo without changing content, plans or cursor", () => {
  const history = new EditorHistory();
  const bytes = new Uint8Array([1]);
  const pages = [{ index: 0, widthPt: 300, heightPt: 400, thumbUrl: "blob:old" }];
  const objects = [{ id: "mask", kind: "redaction" as const, pageIndex: 0 }];
  history.push({ label: "Open", bytes, pages, objects: [] });
  history.push({ label: "Redact", bytes, pages, objects });
  const transformed = [{ ...pages[0], thumbUrl: "blob:rotated" }];
  history.push({ label: "Rotate", bytes: new Uint8Array([2]), pages: transformed, objects: [] });
  history.undo();
  const before = history.current();
  expect(history.replacePreviews(bytes, pages, new Map([[0, "blob:recovered"]]))).toEqual([
    "blob:old",
  ]);
  expect(history.current()).toBe(before);
  expect(history.current()?.objects).toBe(objects);
  expect(history.current()?.pages).toBe(pages);
  expect(history.index()).toBe(1);
  expect(history.undo()).toMatchObject({ label: "Open", pages: [{ thumbUrl: "blob:recovered" }] });
  expect(history.redo()).toMatchObject({
    label: "Redact",
    pages: [{ thumbUrl: "blob:recovered" }],
  });
  expect(history.redo()).toMatchObject({ label: "Rotate", pages: [{ thumbUrl: "blob:rotated" }] });
});

it("never revokes a URL retained by another byte revision", () => {
  const history = new EditorHistory();
  const bytes = new Uint8Array([1]);
  const pages = [{ index: 0, widthPt: 300, heightPt: 400, thumbUrl: "blob:shared" }];
  history.push({ label: "Open", bytes, pages, objects: [] });
  history.push({
    label: "Edit",
    bytes: new Uint8Array([2]),
    pages: [{ ...pages[0] }],
    objects: [],
  });
  expect(history.replacePreviews(bytes, pages, new Map([[0, null]]))).toEqual([]);
  expect(history.thumbUrls()).toEqual(["blob:shared"]);
});
