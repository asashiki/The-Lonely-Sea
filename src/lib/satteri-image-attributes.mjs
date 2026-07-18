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
