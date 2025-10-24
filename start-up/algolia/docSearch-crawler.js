// replace or fill-in missing parts
// edit your Algolia DocSearch crawler and replace it with this code

new Crawler({
  appId: ".....", // Algolia DocSearch AppID
  apiKey: "......", // Crawler API key found in the crawler addmin section
  indexPrefix: "",
  maxUrls: 5000,
  rateLimit: 8,
  renderJavaScript: true,
  startUrls: ["<site_url>/sitemap.xml"],
  discoveryPatterns: [],
  schedule: "at 15:49 on Monday",
  maxDepth: 10,
  actions: [
    {
      indexName: ".....", // Algolia DocSearch index name
      pathsToMatch: ["<site_url>/**"],
      recordExtractor: ({ $, helpers }) => {
        // Extract your extra page-wide data first
        const pageTags = $("page-data-tags")
          .text()
          .trim()
          .split(", ")
          .map((tag) => tag.trim());

        const pageCats = $("page-data-cats")
          .text()
          .trim()
          .split(", ")
          .map((cat) => cat.trim());

        const pageHasDynamicContent =
          $("page-data-has-dynamic-content").text().trim().toLowerCase() ===
          "true";

        const pageRelatedPages =
          $("page-related-pages").length > 0
            ? JSON.parse($("page-related-pages").text().trim()) || null
            : null;

        const pageSimilarPages =
          $("page-similar-pages").length > 0
            ? JSON.parse($("page-similar-pages").text().trim()) || null
            : null;

        const pageCreateTime =
          $("page-create-time").length > 0
            ? $("page-create-time").text().trim()
            : null;

        const pageCreateTimestamp = pageCreateTime
          ? Math.floor(new Date(pageCreateTime).getTime() / 1000)
          : null;

        const pageLastUpdate =
          $("page-last-update").length > 0
            ? $("page-last-update").text().trim()
            : null;

        const pageLastUpdateTimestamp = pageLastUpdate
          ? Math.floor(new Date(pageLastUpdate).getTime() / 1000)
          : null;

        const pageReadTime =
          $("page-read-time").length > 0
            ? parseInt($("page-read-time").text().trim())
            : null;

        // Get docsearch records without unsupported options
        const records = helpers.docsearch({
          recordProps: {
            pageTitle: ["page-data-title"],
            pagePermalink: ["page-data-permalink"],
            pageExcerpt: ["page-data-excerpt"],
            pageSummary: ["page-data-summary"],
            pageCollection: ["page-data-collection"],
            lang: ["page-data-language"],
            language: ["page-data-language"],
            lvl1: ["main h1"],
            content: [
              "main p",
              "main li",
              "main code",
              "span",
              "main code",
              "main table",
              "main table td",
              "main table td",
            ],
            lvl0: {
              selectors: "",
              defaultValue: "Documentation",
            },
            lvl2: ["main h2"],
            lvl3: ["main h3"],
            lvl4: ["main h4"],
            lvl5: ["main h5"],
            lvl6: ["main h6"],
          },
          recordVersion: "v3",
        });

        // Map over records to add your extra fields and transform label
        return records.map((record) => {
          return {
            ...record,
            pageTags: pageTags,
            pageCats: pageCats,
            pageHasDynamicContent: pageHasDynamicContent,
            pageRelatedPages: pageRelatedPages,
            pageSimilarPages: pageSimilarPages,
            pageCreateTime: pageCreateTime,
            pageCreateTimestamp: pageCreateTimestamp,
            pageLastUpdate: pageLastUpdate,
            pageLastUpdateTimestamp: pageLastUpdateTimestamp,
            pageReadTime: pageReadTime,

            // this how the labels of retrievable attributes
            // can be changed
            // HEADS UP!!!
            // THE INDEX MUST BE RE-CONFIGURED TO RETRIEVE THE RENAMEND ATTRIBUTES
            // SHOULD BE SEARCHABLE, RETRIEVABLE AND INCLUDED IN THE SNIPPED RETURNED BY QUERY
            // the next example renames hierarchy.lvl1 to Heading 1
            "Heading 1":
              record.hierarchy && record.hierarchy.lvl1
                ? `${record.hierarchy.lvl1}`
                : null,
          };
        });
      },
    },
  ],
  sitemaps: ["<site_url>/sitemap.xml"],
  initialIndexSettings: {
    "aroo-innohub": {
      advancedSyntax: true,
      allowTyposOnNumericTokens: false,
      attributeCriteriaComputedByMinProximity: true,
      attributeForDistinct: "url",
      attributesForFaceting: ["type", "lang"],
      attributesToHighlight: ["hierarchy", "content"],
      attributesToRetrieve: [
        "hierarchy",
        "content",
        "anchor",
        "url",
        "url_without_anchor",
        "type",
      ],
      attributesToSnippet: ["content:10"],
      camelCaseAttributes: ["hierarchy", "content"],
      customRanking: [
        "desc(weight.pageRank)",
        "desc(weight.level)",
        "asc(weight.position)",
      ],
      distinct: 1,
      highlightPostTag: "</span>",
      highlightPreTag: '<span class="algolia-docsearch-suggestion--highlight">',
      ignorePlurals: true,
      minProximity: 1,
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 7,
      ranking: [
        "words",
        "filters",
        "typo",
        "attribute",
        "proximity",
        "exact",
        "custom",
      ],
      removeWordsIfNoResults: "allOptional",
      searchableAttributes: [
        "unordered(hierarchy.lvl0)",
        "unordered(hierarchy.lvl1)",
        "unordered(hierarchy.lvl2)",
        "unordered(hierarchy.lvl3)",
        "unordered(hierarchy.lvl4)",
        "unordered(hierarchy.lvl5)",
        "unordered(hierarchy.lvl6)",
        "content",
      ],
    },
  },
  ignoreCanonicalTo: false,
  safetyChecks: { beforeIndexPublishing: { maxLostRecordsPercentage: 10 } },
  exclusionPatterns: [
    "<site_url>/cat-info",
    "<site_url>/cat-info*?*",
    "<site_url>/tag-info",
    "<site_url>/tag-info*?*",
    "<site_url>/site-pages",
    "<site_url>/site-pages*?*",
    "<site_url>/no_set",
    "<site_url>/*/cat-info",
    "<site_url>/*/cat-info*?*",
    "<site_url>/*/tag-info",
    "<site_url>/*/tag-info*?*",
    "<site_url>/*/site-pages",
    "<site_url>/*/site-pages*?*",
    "<site_url>/*/no_set",
    "<site_url>/**/pageLink",
  ],
});