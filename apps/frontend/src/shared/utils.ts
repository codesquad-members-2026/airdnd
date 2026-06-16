/** Format a number as Korean Won: ₩1,234,567 */
export function won(n: number): string {
  return '₩' + n.toLocaleString('en-US');
}
