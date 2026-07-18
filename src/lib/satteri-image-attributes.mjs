export function satteriImageAttributes() {
  return {
    name: "image-loading-attributes",
    element: {
      filter: ["img"],
      visit(node, context) {
        if (node.properties.loading == null) {
          context.setProperty(node, "loading", "lazy");
        }

        if (node.properties.decoding == null) {
          context.setProperty(node, "decoding", "async");
        }
      },
    },
  };
}

const directImagePattern = /\.(?:avif|gif|jpe?g|jfif|png|webp)(?:[?#].*)?$/i;

function getClassNames(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" ? value.split(/\s+/).filter(Boolean) : [];
}

export function satteriImageLinkPreviews() {
  return {
    name: "image-link-previews",
    element: {
      filter: ["a"],
      visit(node, context) {
        const href = node.properties.href;

        if (
          typeof href !== "string" ||
          !directImagePattern.test(href) ||
          context.textContent(node).trim() === ""
        ) {
          return;
        }

        const classNames = getClassNames(node.properties.className);
        context.setProperty(node, "className", [...new Set([...classNames, "image-preview-link"])]);
        context.appendChild(node, {
          type: "element",
          tagName: "span",
          properties: {
            ariaHidden: "true",
            className: ["image-link-preview"],
          },
          children: [
            {
              type: "element",
              tagName: "img",
              properties: {
                alt: "",
                decoding: "async",
                loading: "lazy",
                src: href,
              },
              children: [],
            },
          ],
        });
      },
    },
  };
}
