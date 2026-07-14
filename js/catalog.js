(function () {
  "use strict";

  var API_URL = window.FLORA_API;
  var API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

  function resolvePhotoUrl(photoURL) {
    if (!photoURL) return "";
    // Gravatar/absolute URLs are used as-is; Multer uploads come back as a
    // relative "/photos/..." path that must resolve against the backend.
    return /^https?:\/\//i.test(photoURL) ? photoURL : API_ORIGIN + photoURL;
  }

  var grid = document.getElementById("bouquetGrid");
  if (!grid) return;

  var searchInput = document.getElementById("catalogueSearch");
  var loadMoreBtn = document.getElementById("showMoreBtn");

  var loadingState = document.getElementById("catalogueLoading");
  var errorState = document.getElementById("catalogueError");
  var emptyState = document.getElementById("catalogueEmpty");
  var endState = document.getElementById("catalogueEnd");

  // The real backend has no pagination/search query params (it's a plain
  // GET /api/bouquets returning the whole collection), so we fetch once
  // and do search + "load more" pagination on the client.
  var state = {
    allItems: [],
    filteredItems: [],
    query: "",
    shownCount: 0,
    pageSize: 6,
  };

  var searchDebounceTimer = null;

  function hideAllStates() {
    [loadingState, errorState, emptyState, endState].forEach(function (el) {
      if (el) el.classList.remove("is-visible");
    });
  }

  function showState(el) {
    hideAllStates();
    if (el) el.classList.add("is-visible");
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function cardTemplate(item) {
    var title = escapeHtml(item.title);
    var photoURL = escapeHtml(resolvePhotoUrl(item.photoURL));
    var description = escapeHtml(item.description);
    var price = escapeHtml(item.price);

    return (
      '<li class="product-card" data-id="' +
      escapeHtml(item.id) +
      '">' +
      '<div class="product-card__media">' +
      '<img src="' +
      photoURL +
      '" width="340" height="296" alt="' +
      title +
      ' bouquet" loading="lazy" />' +
      "</div>" +
      '<div class="product-card__body">' +
      '<h3 class="product-card__title">' +
      title +
      "</h3>" +
      '<p class="product-card__text">' +
      description +
      "</p>" +
      '<div class="product-card__footer">' +
      '<span class="product-card__price">$' +
      price +
      "</span>" +
      '<div class="product-card__actions">' +
      '<button type="button" class="product-card__link js-view-btn" ' +
      'data-title="' + title + '" ' +
      'data-price="' + price + '" ' +
      'data-image1x="' + photoURL + '" ' +
      'data-image2x="' + photoURL + '" ' +
      'data-description="' + description + '">' +
      "Details" +
      "</button>" +
      '<button type="button" class="product-card__link js-order-btn" data-bouquet="' +
      title +
      '">' +
      "Order now" +
      '<svg class="icon" aria-hidden="true"><use href="images/icons.svg#icon-arrow-right" xlink:href="images/icons.svg#icon-arrow-right"></use></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</li>"
    );
  }

  function resetGrid() {
    grid.innerHTML = "";
    state.shownCount = 0;
  }

  function renderNextPage() {
    var nextBatch = state.filteredItems.slice(
      state.shownCount,
      state.shownCount + state.pageSize
    );

    var html = "";
    nextBatch.forEach(function (item) {
      html += cardTemplate(item);
    });

    if (html) {
      grid.insertAdjacentHTML("beforeend", html);
    }

    state.shownCount += nextBatch.length;
    updateFooterState();
  }

  function updateFooterState() {
    hideAllStates();

    if (state.filteredItems.length === 0) {
      showState(emptyState);
      if (loadMoreBtn) loadMoreBtn.setAttribute("hidden", "");
      return;
    }

    var reachedEnd = state.shownCount >= state.filteredItems.length;

    if (reachedEnd) {
      if (loadMoreBtn) loadMoreBtn.setAttribute("hidden", "");
      showState(endState);
    } else if (loadMoreBtn) {
      loadMoreBtn.removeAttribute("hidden");
    }
  }

  function applyFilters() {
    var query = state.query.toLowerCase();

    state.filteredItems = !query
      ? state.allItems
      : state.allItems.filter(function (item) {
          var haystack =
            (item.title || "") + " " + (item.description || "");
          return haystack.toLowerCase().indexOf(query) !== -1;
        });

    resetGrid();
    renderNextPage();
  }

  async function fetchBouquets() {
    showState(loadingState);

    try {
      var response = await axios.get(API_URL + "/bouquets");
      state.allItems = Array.isArray(response.data) ? response.data : [];
      applyFilters();
    } catch (error) {
      showState(errorState);
      if (loadMoreBtn) loadMoreBtn.setAttribute("hidden", "");
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = window.setTimeout(function () {
        state.query = searchInput.value.trim();
        applyFilters();
      }, 350);
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", renderNextPage);
  }

  fetchBouquets();
})();
