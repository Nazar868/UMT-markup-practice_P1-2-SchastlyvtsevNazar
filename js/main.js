(function () {
  "use strict";

  var burgerBtn = document.getElementById("burgerBtn");
  var mobileMenu = document.getElementById("mobileMenu");

  if (burgerBtn && mobileMenu) {
    var menuLinks = mobileMenu.querySelectorAll("a");

    var closeMenu = function () {
      burgerBtn.classList.remove("is-open");
      mobileMenu.classList.remove("is-open");
      burgerBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    };

    var toggleMenu = function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      burgerBtn.classList.toggle("is-open", isOpen);
      burgerBtn.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("no-scroll", isOpen);
    };

    burgerBtn.addEventListener("click", toggleMenu);

    menuLinks.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("keyup", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  // Bouquet catalogue pagination/filtering is handled by js/catalog.js,
  // and the order/subscribe forms are handled by js/modal.js.

  if (window.AOS) {
    window.AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 40,
    });
  }
})();
