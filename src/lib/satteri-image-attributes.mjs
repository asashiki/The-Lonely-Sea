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

function safeDecodeTerm(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function satteriReadingAnnotations() {
  return {
    name: "reading-annotations",
    element: {
      filter: ["a"],
      visit(node, context) {
        const href = node.properties.href;
        if (typeof href !== "string") return;
        const classNames = getClassNames(node.properties.className);

        if (href.startsWith("term:")) {
          const term = safeDecodeTerm(href.slice(5)).trim() || context.textContent(node).trim();
          const definition = typeof node.properties.title === "string"
            ? node.properties.title.trim()
            : "文章没有为这个术语补充注释。";
          context.replaceNode(node, {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              ariaHaspopup: "dialog",
              className: [...new Set([...classNames, "reading-term"])],
              dataReadingTerm: term,
              dataReadingDefinition: definition,
            },
            children: [...node.children],
          });
          return;
        }

        context.setProperty(node, "className", [...new Set([...classNames, "reading-inline-link"])]);
        if (/^https?:\/\//i.test(href)) context.setProperty(node, "dataReadingExternal", "true");
      },
    },
  };
}
