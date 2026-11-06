const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Single source of truth for assets: src/assets -> docs/assets
  // (css, js, images, fonts). The layout references /assets/...
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Custom domain file must survive every build (GitHub Pages)
  eleventyConfig.addPassthroughCopy({ "CNAME": "CNAME" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "docs"
    },
    templateFormats: ["html", "md", "liquid", "njk"],
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid"
  };
};
