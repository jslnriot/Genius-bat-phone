export function formatCountNoun(
  count: number,
  singular: string,
  plural: string,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function contactCountDescription(count: number) {
  if (count === 0) {
    return "Add someone you want to reach through Bat Phone.";
  }
  if (count === 1) {
    return "1 person you can reach through Bat Phone.";
  }
  return `${count} people you can reach through Bat Phone.`;
}

export function callCountDescription(count: number) {
  if (count === 0) {
    return "Calls you make through Bat Phone will appear here.";
  }
  if (count === 1) {
    return "1 call in your history.";
  }
  return `${count} calls in your history.`;
}
