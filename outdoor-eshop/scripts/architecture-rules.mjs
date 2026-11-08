import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

function sourceParts(filename) {
  const relative = path.relative(sourceRoot, filename);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative.split(path.sep);
}

function checkImport(filename, specifier) {
  const from = sourceParts(filename);
  if (!from) return null;
  const feature = from[0] === "features" ? from[1] : null;
  const layer = feature ? from[2] : null;
  const isTest = /\.test\.[cm]?[jt]sx?$/.test(filename);
  const target = specifier.startsWith("@/")
    ? path.resolve(sourceRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(filename), specifier)
      : null;
  if (!target) {
    if (!isTest && (layer === "domain" || layer === "application" ||
      (from[0] === "shared" && from[1] === "domain")) &&
      /^(next|react|drizzle-orm|postgres)(\/|$)/.test(specifier)) {
      return "Domain and application must not depend on frameworks or database drivers.";
    }
    return null;
  }
  const to = sourceParts(target);
  const targetFeature = to?.[0] === "features" ? to[1] : null;
  const targetLayer = targetFeature ? to[2] : null;
  const presentationPage = from[0] === "app" && from[1] === "pages"
    ? from[2]
    : null;
  const targetPresentationPage = to?.[0] === "app" && to[1] === "pages"
    ? to[2]
    : null;
  const presentationComponent = presentationPage !== null ||
    (from[0] === "app" && from[1] === "_components");
  const sharedDomain = to?.[0] === "shared" && to[1] === "domain";
  if ((layer === "domain" || (from[0] === "shared" && from[1] === "domain")) &&
    !(targetLayer === "domain" || sharedDomain)) {
    return "Domain may only depend on domain.";
  }
  if (layer === "application" &&
    !(["domain", "application"].includes(targetLayer) || sharedDomain)) {
    return "Application may only depend on domain or application.";
  }
  if (layer === "infrastructure" && to &&
    (to[0] === "app" || targetLayer === "composition" ||
      (to[0] === "shared" && to[1] === "composition"))) {
    return "Infrastructure must not depend on presentation or composition.";
  }
  if (layer === "infrastructure" && targetLayer === "infrastructure" &&
    feature !== targetFeature) {
    return "Infrastructure modules must not import each other's internal adapters.";
  }
  if (presentationComponent && targetLayer === "infrastructure") {
    return "Presentation must access adapters through composition.";
  }
  if (presentationPage && targetPresentationPage &&
    presentationPage !== targetPresentationPage) {
    return "Page presentation must not depend on another page; share components through app/_components.";
  }
  return null;
}

export const architectureRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: { boundary: "{{message}}" },
  },
  create(context) {
    function inspect(node, source) {
      if (typeof source?.value !== "string") return;
      const message = checkImport(context.filename, source.value);
      if (message) context.report({ node, messageId: "boundary", data: { message } });
    }
    return {
      ImportDeclaration(node) { inspect(node, node.source); },
      ExportNamedDeclaration(node) { inspect(node, node.source); },
      ExportAllDeclaration(node) { inspect(node, node.source); },
      ImportExpression(node) { inspect(node, node.source); },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require") {
          inspect(node, node.arguments[0]);
        }
      },
    };
  },
};
