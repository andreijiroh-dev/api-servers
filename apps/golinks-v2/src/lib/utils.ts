export const PAGE_SIZE = 10;

export function getOffset(page: number): number {
  return Math.max(0, page) * PAGE_SIZE;
}

export function generateSlug(length: number) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
