// PRMovies Posts Module - SYNCHRONOUS VERSION for Rhino JS

var BASE_URL = "https://prmovies.delivery";

var headers = {
  "Referer": "https://google.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};

function getPosts(filter, page, providerContext) {
  console.log("getPosts called with filter:", filter, "page:", page);

  try {
    var url;
    if (filter === "" || filter === "/") {
      // Homepage - get featured content
      url = BASE_URL + "/";
      if (page > 1) {
        url = BASE_URL + "/page/" + page + "/";
      }
    } else {
      // Category/genre pages
      url = BASE_URL + filter + "/page/" + page + "/";
    }
    console.log("Fetching URL:", url);

    var response = axios.get(url, { headers: headers });
    console.log("Response received, data length:", response.data ? response.data.length : 0);

    if (!response.data) {
      console.error("No response data");
      return [];
    }

    var $ = cheerio.load(response.data);
    var posts = [];

    // PRMovies uses div.ml-item for movie cards
    var items = $("div.ml-item");
    console.log("Found ml-item items:", items.length);

    for (var i = 0; i < items.length; i++) {
      try {
        var element = items.eq(i);
        var link = element.find("a.ml-mask").first();
        var img = element.find("img.mli-thumb").first();
        var titleEl = element.find(".mli-info h2").first();

        var title = titleEl.text() || img.attr("alt") || "";
        var href = link.attr("href") || "";
        // PRMovies uses data-original for lazy loading images
        var image = img.attr("data-original") || img.attr("src") || img.attr("data-src") || "";

        // Clean up title
        title = title.trim();

        if (title && href && image) {
          posts.push({
            title: title,
            link: href,
            image: image
          });
        }
      } catch (e) {
        console.error("Error parsing item:", e);
      }
    }

    // Fallback: try article.item structure
    if (posts.length === 0) {
      var articleItems = $("article.item");
      console.log("Fallback article items:", articleItems.length);
      
      for (var j = 0; j < articleItems.length; j++) {
        try {
          var el = articleItems.eq(j);
          var lnk = el.find("a").first();
          var img2 = el.find("img").first();
          var ttl = el.find("h2, h3, .title").first();

          var t = ttl.text() || img2.attr("alt") || "";
          var h = lnk.attr("href") || "";
          var im = img2.attr("data-original") || img2.attr("src") || "";

          if (t && h && im) {
            posts.push({
              title: t.trim(),
              link: h,
              image: im
            });
          }
        } catch (e) {
          console.error("Error parsing article item:", e);
        }
      }
    }

    console.log("Found", posts.length, "posts");
    return posts;
  } catch (err) {
    console.error("getPosts error:", err.message || err);
    return [];
  }
}

function getSearchPosts(query, page, providerContext) {
  console.log("getSearchPosts called with query:", query, "page:", page);

  try {
    // PRMovies search URL format
    var url = BASE_URL + "/page/" + page + "/?s=" + encodeURIComponent(query);
    console.log("Search URL:", url);

    var response = axios.get(url, { headers: headers });
    console.log("Search response received, data length:", response.data ? response.data.length : 0);

    if (!response.data) {
      console.error("No search response data");
      return [];
    }

    var $ = cheerio.load(response.data);
    var posts = [];

    // Search results use same ml-item structure
    var items = $("div.ml-item");
    console.log("Found search items:", items.length);

    for (var i = 0; i < items.length; i++) {
      try {
        var element = items.eq(i);
        var link = element.find("a.ml-mask").first();
        var img = element.find("img.mli-thumb").first();
        var titleEl = element.find(".mli-info h2").first();

        var title = titleEl.text() || img.attr("alt") || "";
        var href = link.attr("href") || "";
        var image = img.attr("data-original") || img.attr("src") || "";

        title = title.trim();

        if (title && href && image) {
          posts.push({
            title: title,
            link: href,
            image: image
          });
        }
      } catch (e) {
        console.error("Error parsing search item:", e);
      }
    }

    console.log("Found", posts.length, "search results");
    return posts;
  } catch (err) {
    console.error("getSearchPosts error:", err.message || err);
    return [];
  }
}
