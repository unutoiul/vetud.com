// Lets plain Node import app modules the way the Next.js bundler allows: extensionless relative
// imports ("./categories") are retried with ".ts", and "@/..." points at src/.
const SRC = new URL("../../src/", import.meta.url)

export async function resolve(specifier, context, next) {
  const target = specifier.startsWith("@/") ? new URL(specifier.slice(2), SRC).href : specifier
  try {
    return await next(target, context)
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND" && /^(\.{1,2}\/|file:)/.test(target) && !/\.[cm]?[jt]sx?$/.test(target)) return next(`${target}.ts`, context)
    throw error
  }
}
