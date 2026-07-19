export function required(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Missing experience element: ${selector}`);
  return element;
}

export function all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

export function updatePressed(selector, value, dataKey) {
  all(selector).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset[dataKey] === value));
  });
}
