export function getFormattedDate(date) {
  return `${date.getFullYear()}-${
    String(date.getMonth()+1).padStart(2,'0')
  }-${
    String(date.getDate()).padStart(2,'0')
  }`;
}

export function getDateMinusDays(date, days) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - days
  );
}
