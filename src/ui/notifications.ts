import { getElement } from "@/utils/elements";

export function renderNotifications() {
  window.addEventListener("notificationCreated", (event) => {
    getElement("nf").innerHTML = render(event.detail.message);
    if (event.detail.timeout) {
      setTimeout(() => {
        dismiss();
      }, event.detail.timeout);
    }
  });
  return '<div id="nf"></div>';
}

function render(message: string) {
  setTimeout(() => {
    getElement("nf").firstChild?.addEventListener("click", dismiss);
  });
  if (!message) {
    return "";
  }
  return `<button><div>${message}</div></button>`;
}

function dismiss() {
  getElement("nf").innerHTML = render("");
}

export const notifications = {
  weRaisedStakes: (points: number) =>
    `You called ${getRaiseName(points)}! Waiting response...`,
  theyAccepted: "They accepted! Let's continue...",
  theyRejected: "They rejected! The round is yours!",
};

function getRaiseName(points: number) {
  return pointsToWords?.[points] ?? "a raise";
}

const pointsToWords: Record<number, string> = {
  3: "Truco",
  6: "Six",
  9: "Nine",
  12: "Twelve",
};
